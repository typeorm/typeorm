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
    let getManySpy: sinon.SinonSpy
    let getOneSpy: sinon.SinonSpy
    let getRawManySpy: sinon.SinonSpy

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            logging: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("it should load eager relations using relationLoadStrategy as main strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepository = dataSource.getRepository(Author)
                const bookRepository = dataSource.getRepository(Book)
                const commentRepository = dataSource.getRepository(Comment)

                const author = authorRepository.create({ name: "author" })
                await authorRepository.save(author)

                const book = bookRepository.create({
                    title: "book",
                    text: "text",
                    author: [author],
                })
                await bookRepository.save(book)

                const comment = commentRepository.create({
                    text: "comment",
                    author,
                    bookId: book.id,
                })
                await commentRepository.save(comment)

                getManySpy = sinon.spy(SelectQueryBuilder.prototype, "getMany")
                getOneSpy = sinon.spy(SelectQueryBuilder.prototype, "getOne")
                getRawManySpy = sinon.spy(
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
                    expect(
                        call.thisValue.expressionMap.joinAttributes,
                    ).to.be.an("array")
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
                            title: "book",
                            text: "text",
                            comments: [
                                {
                                    id: 1,
                                    text: "comment",
                                    bookId: 1,
                                    authorId: 1,
                                },
                            ],
                        },
                    ],
                })

                getManySpy.restore()
                getOneSpy.restore()
                getRawManySpy.restore()
            }),
        ))
})
