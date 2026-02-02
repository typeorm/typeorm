import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Book } from "./entity/Book"

describe("github issues > #3551 array of embedded documents through multiple levels are not handled", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mongodb"],
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(connections))

    it("should return entity with all these embedded documents", () =>
        Promise.all(
            connections.map(async (connection) => {
                const bookInput = {
                    title: "Book 1",
                    chapters: [
                        {
                            title: "Chapter 1",
                            pages: [
                                {
                                    number: 1,
                                },
                                {
                                    number: 2,
                                },
                            ],
                        },
                        {
                            title: "Chapter 2",
                            pages: [
                                {
                                    number: 3,
                                },
                                {
                                    number: 4,
                                },
                            ],
                        },
                    ],
                }

                await connection.mongoManager
                    .getMongoRepository(Book)
                    .insert(bookInput)

                const books = await connection.mongoManager
                    .getMongoRepository(Book)
                    .find()
                const book = books[0]

                book!.title.should.be.equal(bookInput.title)
                book!.chapters.should.be.lengthOf(2)
                book!.chapters[0].title.should.be.equal(
                    bookInput.chapters[0].title,
                )
                book!.chapters[0].pages.should.have.lengthOf(2)
                book!.chapters[0].pages[0].number.should.be.equal(
                    bookInput.chapters[0].pages[0].number,
                )
                book!.chapters[0].pages[1].number.should.be.equal(
                    bookInput.chapters[0].pages[1].number,
                )
                book!.chapters[1].pages.should.have.lengthOf(2)
                book!.chapters[1].pages[0].number.should.be.equal(
                    bookInput.chapters[1].pages[0].number,
                )
                book!.chapters[1].pages[1].number.should.be.equal(
                    bookInput.chapters[1].pages[1].number,
                )
            }),
        ))
})
