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
import { Category } from "./entity/Category"

describe("relations > load-strategy > query", () => {
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
        return { authorRepository, bookRepository, author, books }
    }

    describe("ManyToMany eager", () => {
        it("should load eager ManyToMany relations via query strategy", () =>
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
                    expect(result!.books).to.be.an("array")
                    expect(result!.books).to.have.length(3)

                    const titles = result!.books.map((b) => b.title).sort()
                    expect(titles).to.deep.equal(["book1", "book2", "book3"])
                }),
            ))
    })

    describe("OneToMany eager (nested)", () => {
        it("should load nested eager OneToMany relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, author } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    for (const book of result!.books) {
                        expect(book.comments).to.be.an("array")
                        expect(book.comments).to.have.length(3)
                        for (const comment of book.comments!) {
                            expect(comment.text).to.include(book.title)
                        }
                    }
                }),
            ))
    })

    describe("ManyToOne eager", () => {
        it("should load eager ManyToOne relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { bookRepository, books } =
                        await setupTestData(dataSource)

                    const comments = await dataSource
                        .getRepository(Comment)
                        .find({
                            where: { bookId: books[0].id },
                            relationLoadStrategy: "query",
                        })

                    expect(comments).to.have.length(3)
                    for (const comment of comments) {
                        expect(comment.author).to.not.be.undefined
                        expect(comment.author).to.not.be.null
                        expect(comment.author.name).to.equal("author")
                    }
                }),
            ))
    })

    describe("self-referencing", () => {
        it("should load self-referencing parent relation via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    const parent = new Category()
                    await manager.save(parent)

                    const child = new Category()
                    child.parent = parent
                    await manager.save(child)

                    const loaded = await manager.findOne(Category, {
                        where: { id: child.id },
                        relations: { parent: true },
                        relationLoadStrategy: "query",
                    })

                    expect(loaded).to.not.be.null
                    expect(loaded?.parent).to.not.be.null
                    expect(loaded?.parent?.id).to.equal(parent.id)
                }),
            ))

        it("should load three levels of self-referencing relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    const grandparent = new Category()
                    await manager.save(grandparent)

                    const parent = new Category()
                    parent.parent = grandparent
                    await manager.save(parent)

                    const child = new Category()
                    child.parent = parent
                    await manager.save(child)

                    const loaded = await manager.findOne(Category, {
                        where: { id: child.id },
                        relations: { parent: { parent: true } },
                        relationLoadStrategy: "query",
                    })

                    expect(loaded).to.not.be.null
                    expect(loaded?.parent).to.not.be.null
                    expect(loaded?.parent?.id).to.equal(parent.id)
                    expect(loaded?.parent?.parent).to.not.be.null
                    expect(loaded?.parent?.parent?.id).to.equal(grandparent.id)
                }),
            ))
    })

    describe("empty relations", () => {
        it("should return empty array for ManyToMany with no related entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const authorRepository = dataSource.getRepository(Author)

                    const author = await authorRepository.save(
                        authorRepository.create({ name: "lonely author" }),
                    )

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result!.books).to.be.an("array")
                    expect(result!.books).to.have.length(0)
                }),
            ))

        it("should return empty array for OneToMany with no related entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const authorRepository = dataSource.getRepository(Author)
                    const bookRepository = dataSource.getRepository(Book)

                    const author = await authorRepository.save(
                        authorRepository.create({ name: "author" }),
                    )
                    const book = await bookRepository.save(
                        bookRepository.create({
                            title: "empty book",
                            text: "no comments",
                            author: [author],
                        }),
                    )

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    const loadedBook = result!.books.find(
                        (b) => b.id === book.id,
                    )
                    expect(loadedBook).to.not.be.undefined
                    expect(loadedBook!.comments).to.be.an("array")
                    expect(loadedBook!.comments).to.have.length(0)
                }),
            ))
    })

    describe("loadEagerRelations", () => {
        it("should not load any eager relations when loadEagerRelations is false and no explicit relations", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, author } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        loadEagerRelations: false,
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result!.name).to.equal("author")
                    expect(result!.books).to.be.undefined
                }),
            ))

        it("should load explicit relations but suppress nested eager when loadEagerRelations is false", () =>
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
                    expect(result!.books).to.be.an("array")
                    expect(result!.books).to.have.length(3)

                    for (const book of result!.books) {
                        expect(book.comments).to.be.undefined
                    }
                }),
            ))
    })
})
