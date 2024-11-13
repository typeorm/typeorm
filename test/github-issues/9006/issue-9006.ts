import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/index"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Comment } from "./entity/Comment"
import { ObjectLiteral, SelectQueryBuilder } from "../../../src"
import { expect } from "chai"
import sinon from "sinon"

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

                getManySpy.getCalls().forEach((call) => {
                    const self = call.thisValue as ObjectLiteral
                    expect(self.joins).to.be.an("array")
                    expect(self.joins).to.have.length(0)
                })

                getOneSpy.getCalls().forEach((call) => {
                    const self = call.thisValue as ObjectLiteral
                    expect(self.joins).to.be.an("array")
                    expect(self.joins).to.have.length(0)
                })

                getRawManySpy.getCalls().forEach((call) => {
                    const self = call.thisValue as ObjectLiteral
                    expect(self.joins).to.be.an("array")
                    expect(self.joins).to.have.length(0)
                })

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
