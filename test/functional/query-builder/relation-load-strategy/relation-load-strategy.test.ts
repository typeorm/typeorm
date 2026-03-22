import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Comment } from "./entity/Comment"

describe("query builder > relation-load-strategy > eager relations respect relationLoadStrategy", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const setupTestData = async (dataSource: DataSource) => {
        const authorRepository = dataSource.getRepository(Author)
        const bookRepository = dataSource.getRepository(Book)
        const commentRepository = dataSource.getRepository(Comment)

        const author = await authorRepository.save(
            authorRepository.create({ name: "author" }),
        )

        const books = await bookRepository.save(
            bookRepository.create([
                { title: "book1", text: "text1", author: [author] },
                { title: "book2", text: "text2", author: [author] },
                { title: "book3", text: "text3", author: [author] },
            ]),
        )

        for (const book of books) {
            for (let i = 0; i < 3; i++) {
                await commentRepository.save(
                    commentRepository.create({
                        text: `${book.title}: comment${i}`,
                        bookId: book.id,
                        authorId: author.id,
                    }),
                )
            }
        }
        return { authorRepository, author }
    }

    it("should load eager relations using query strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { authorRepository, author } =
                    await setupTestData(dataSource)

                const result = await authorRepository.findOne({
                    where: { id: author.id },
                    relationLoadStrategy: "query",
                })

                expect(result).to.not.be.null
                expect(result!.name).to.equal("author")

                // ManyToMany eager: Author -> Book
                expect(result!.books).to.be.an("array")
                expect(result!.books).to.have.length(3)

                const titles = result!.books
                    .map((b) => b.title)
                    .sort()
                expect(titles).to.deep.equal(["book1", "book2", "book3"])

                // OneToMany eager: Book -> Comment (nested)
                for (const book of result!.books) {
                    expect(book.comments).to.be.an("array")
                    expect(book.comments).to.have.length(3)
                    for (const comment of book.comments!) {
                        expect(comment.text).to.include(book.title)
                    }
                }
            }),
        ))

    it("should suppress nested eager relations when loadEagerRelations is false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { authorRepository, author } =
                    await setupTestData(dataSource)

                const result = await authorRepository.findOne({
                    where: { id: author.id },
                    relations: { books: true },
                    loadEagerRelations: false,
                    relationLoadStrategy: "query",
                })

                expect(result).to.not.be.null
                expect(result!.name).to.equal("author")

                // Explicit relation loads
                expect(result!.books).to.be.an("array")
                expect(result!.books).to.have.length(3)

                // But nested eager (Book.comments) should NOT load
                for (const book of result!.books) {
                    expect(book.comments).to.be.undefined
                }
            }),
        ))
})
