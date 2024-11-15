import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"
import { SelectQueryBuilder } from "../../../src"
import { DataSource } from "../../../src/data-source/index"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Comment } from "./entity/Comment"

describe("github issues > #9006 Eager relations do not respect relationLoadStrategy", () => {
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

    it("it should load eager relations using relationLoadStrategy as main strategy", async () => {
        for (const dataSource of dataSources) {
            const authorRepository = dataSource.getRepository(Author)
            const bookRepository = dataSource.getRepository(Book)
            const commentRepository = dataSource.getRepository(Comment)

            const authorModel = await authorRepository.create({
                name: "author",
            })
            const author = await authorRepository.save(authorModel)

            const bookModels = await bookRepository.create([
                {
                    title: "book1",
                    text: "text1",
                    author: [author],
                },
                {
                    title: "book2",
                    text: "text2",
                    author: [author],
                },
                {
                    title: "book3",
                    text: "text3",
                    author: [author],
                },
            ])
            const books = await bookRepository.save(bookModels)

            for (const book of books) {
                for (let index = 0; index < 3; index++) {
                    const comment = await commentRepository.create({
                        text: `${book.title}: comment${index}`,
                        bookId: book.id,
                        authorId: author.id,
                    })
                    await commentRepository.save(comment)
                }
            }

            const getManySpy = await sinon.spy(
                SelectQueryBuilder.prototype,
                "getMany",
            )
            const getOneSpy = await sinon.spy(
                SelectQueryBuilder.prototype,
                "getOne",
            )
            const getRawManySpy = await sinon.spy(
                SelectQueryBuilder.prototype,
                "getRawMany",
            )

            const eageredAuthor = await authorRepository.findOne({
                where: { id: author.id },
                relationLoadStrategy: "query",
            })

            const [manyToManyCall] = getManySpy.getCalls()

            expect(
                manyToManyCall.thisValue.expressionMap.joinAttributes,
            ).to.be.an("array")
            expect(
                manyToManyCall.thisValue.expressionMap.joinAttributes,
            ).to.have.length(1) // Only join attribute allowed, in many to many relations, to be more performatic

            getOneSpy.getCalls().forEach((call) => {
                expect(call.thisValue.expressionMap.joinAttributes).to.be.an(
                    "array",
                )
                expect(
                    call.thisValue.expressionMap.joinAttributes,
                ).to.have.length(0) // No Join Attributes in relationLoadStrategy: "query",
            })

            expect(getRawManySpy.callCount).to.be.equal(1)
            expect(getManySpy.callCount).to.be.equal(2)
            expect(getOneSpy.callCount).to.be.equal(1)

            expect(eageredAuthor).to.deep.equal({
                id: 1,
                name: "author",
                books: [
                    {
                        id: 1,
                        title: "book1",
                        text: "text1",
                        comments: [
                            {
                                id: 1,
                                text: "book1: comment0",
                                bookId: 1,
                                authorId: 1,
                            },
                            {
                                id: 2,
                                text: "book1: comment1",
                                bookId: 1,
                                authorId: 1,
                            },
                            {
                                id: 3,
                                text: "book1: comment2",
                                bookId: 1,
                                authorId: 1,
                            },
                        ],
                    },
                    {
                        id: 2,
                        title: "book2",
                        text: "text2",
                        comments: [
                            {
                                id: 4,
                                text: "book2: comment0",
                                bookId: 2,
                                authorId: 1,
                            },
                            {
                                id: 5,
                                text: "book2: comment1",
                                bookId: 2,
                                authorId: 1,
                            },
                            {
                                id: 6,
                                text: "book2: comment2",
                                bookId: 2,
                                authorId: 1,
                            },
                        ],
                    },
                    {
                        id: 3,
                        title: "book3",
                        text: "text3",
                        comments: [
                            {
                                id: 7,
                                text: "book3: comment0",
                                bookId: 3,
                                authorId: 1,
                            },
                            {
                                id: 8,
                                text: "book3: comment1",
                                bookId: 3,
                                authorId: 1,
                            },
                            {
                                id: 9,
                                text: "book3: comment2",
                                bookId: 3,
                                authorId: 1,
                            },
                        ],
                    },
                ],
            })

            getManySpy.restore()
            getOneSpy.restore()
            getRawManySpy.restore()
        }
    })
})
