import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Counters } from "./entity/Counters"
import { expect } from "chai"
import { Color } from "./entity/Color"

describe("mongodb > array columns", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, Counters],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should insert / update array columns correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                post.names = ["umed", "dima", "bakhrom"]
                post.numbers = [1, 0, 1]
                post.booleans = [true, false, false]
                post.counters = [
                    new Counters(1, "number #1", new Color("red")),
                    new Counters(2, "number #2", new Color("green")),
                    new Counters(3, "number #3", new Color("blue")),
                ]
                post.other1 = []
                await postRepository.save(post)

                // check saved post
                const loadedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedPost).to.be.not.empty
                expect(loadedPost!.names).to.be.not.empty
                expect(loadedPost!.numbers).to.be.not.empty
                expect(loadedPost!.booleans).to.be.not.empty
                expect(loadedPost!.counters).to.be.not.empty
                loadedPost!.other1.length.should.be.equal(0)
                expect(loadedPost!.other2).to.be.undefined

                loadedPost!.names[0].should.be.equal("umed")
                loadedPost!.names[1].should.be.equal("dima")
                loadedPost!.names[2].should.be.equal("bakhrom")

                loadedPost!.numbers[0].should.be.equal(1)
                loadedPost!.numbers[1].should.be.equal(0)
                loadedPost!.numbers[2].should.be.equal(1)

                loadedPost!.booleans[0].should.be.equal(true)
                loadedPost!.booleans[1].should.be.equal(false)
                loadedPost!.booleans[2].should.be.equal(false)

                loadedPost!.counters[0].should.be.instanceOf(Counters)
                loadedPost!.counters[1].should.be.instanceOf(Counters)
                loadedPost!.counters[2].should.be.instanceOf(Counters)

                loadedPost!.counters[0].likes.should.be.equal(1)
                loadedPost!.counters[1].likes.should.be.equal(2)
                loadedPost!.counters[2].likes.should.be.equal(3)

                loadedPost!.counters[0].text.should.be.equal("number #1")
                loadedPost!.counters[1].text.should.be.equal("number #2")
                loadedPost!.counters[2].text.should.be.equal("number #3")

                loadedPost!.counters[0].color.should.be.instanceOf(Color)
                loadedPost!.counters[1].color.should.be.instanceOf(Color)
                loadedPost!.counters[2].color.should.be.instanceOf(Color)

                loadedPost!.counters[0].color.name.should.be.equal("red")
                loadedPost!.counters[1].color.name.should.be.equal("green")
                loadedPost!.counters[2].color.name.should.be.equal("blue")

                // now update the post
                post.names = ["umed!", "dima!", "bakhrom!"]
                post.numbers = [11, 10, 11]
                post.booleans = [true, true, true]
                post.counters = [
                    new Counters(11, "number #11", new Color("yellow")),
                    new Counters(12, "number #12", new Color("blue")),
                ]
                post.other1 = [new Counters(0, "other", new Color("red"))]
                await postRepository.save(post)

                // now load updated post
                const loadedUpdatedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedUpdatedPost).to.be.not.empty
                expect(loadedUpdatedPost!.names).to.be.not.empty
                expect(loadedUpdatedPost!.numbers).to.be.not.empty
                expect(loadedUpdatedPost!.booleans).to.be.not.empty
                expect(loadedUpdatedPost!.counters).to.be.not.empty
                expect(loadedUpdatedPost!.other1).to.be.not.empty
                expect(loadedUpdatedPost!.other2).to.be.undefined

                loadedUpdatedPost!.names[0].should.be.equal("umed!")
                loadedUpdatedPost!.names[1].should.be.equal("dima!")
                loadedUpdatedPost!.names[2].should.be.equal("bakhrom!")

                loadedUpdatedPost!.numbers[0].should.be.equal(11)
                loadedUpdatedPost!.numbers[1].should.be.equal(10)
                loadedUpdatedPost!.numbers[2].should.be.equal(11)

                loadedUpdatedPost!.booleans[0].should.be.equal(true)
                loadedUpdatedPost!.booleans[1].should.be.equal(true)
                loadedUpdatedPost!.booleans[2].should.be.equal(true)

                loadedUpdatedPost!.counters[0].should.be.instanceOf(Counters)
                loadedUpdatedPost!.counters[1].should.be.instanceOf(Counters)

                loadedUpdatedPost!.counters[0].likes.should.be.equal(11)
                loadedUpdatedPost!.counters[1].likes.should.be.equal(12)

                loadedUpdatedPost!.counters[0].text.should.be.equal(
                    "number #11",
                )
                loadedUpdatedPost!.counters[1].text.should.be.equal(
                    "number #12",
                )

                loadedUpdatedPost!.counters[0].color.should.be.instanceOf(Color)
                loadedUpdatedPost!.counters[1].color.should.be.instanceOf(Color)

                loadedUpdatedPost!.counters[0].color.name.should.be.equal(
                    "yellow",
                )
                loadedUpdatedPost!.counters[1].color.name.should.be.equal(
                    "blue",
                )

                loadedUpdatedPost!.other1[0].should.be.instanceOf(Counters)
                loadedUpdatedPost!.other1[0].likes.should.be.equal(0)
                loadedUpdatedPost!.other1[0].text.should.be.equal("other")
                loadedUpdatedPost!.other1[0].color.should.be.instanceOf(Color)
                loadedUpdatedPost!.other1[0].color.name.should.be.equal("red")
            }),
        ))

    it("should retrieve arrays from the column metadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post()
                post.title = "Post"
                post.names = ["umed", "dima", "bakhrom"]
                post.numbers = [1, 0, 1]
                post.booleans = [true, false, false]
                post.counters = [
                    new Counters(1, "number #1", new Color("yellow")),
                    new Counters(2, "number #2", new Color("blue")),
                    new Counters(3, "number #3", new Color("green")),
                ]
                post.other1 = []

                const column = connection
                    .getMetadata(Post)
                    .columns.find((c) => c.propertyPath === "counters.text")!

                const value = column.getEntityValue(post)

                expect(value).to.eql(["number #1", "number #2", "number #3"])
            }),
        ))
})
