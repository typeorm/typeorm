import "reflect-metadata"
import { DataSource } from "../../../../../src"
import { Post } from "./entity/Post"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { PostWithoutTypes } from "./entity/PostWithoutTypes"
import { PostWithOptions } from "./entity/PostWithOptions"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("database schema > column types > spanner", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("all types should work correctly - persist and hydrate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const post = new Post()
                post.id = 1
                post.name = "Post"
                post.int64 = 2147483647
                post.string = "This is string"
                post.bytes = Buffer.from("This is bytes")
                post.float64 = 10.53
                post.numeric = "10"
                post.bool = true
                post.date = "2022-03-16"
                post.timestamp = new Date()
                post.json = { param: "VALUE" }
                post.array = ["A", "B", "C"]
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({ id: 1 }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.name.should.be.equal(post.name)
                loadedPost.int64.should.be.equal(post.int64)
                loadedPost.string.should.be.equal(post.string)
                loadedPost.bytes
                    .toString()
                    .should.be.equal(post.bytes.toString())
                loadedPost.float64.should.be.equal(post.float64)
                loadedPost.numeric.should.be.equal(post.numeric)
                loadedPost.bool.should.be.equal(post.bool)
                loadedPost.date.should.be.equal(post.date)
                loadedPost.timestamp
                    .valueOf()
                    .should.be.equal(post.timestamp.valueOf())
                loadedPost.json.should.be.eql(post.json)
                loadedPost.array[0].should.be.equal(post.array[0])
                loadedPost.array[1].should.be.equal(post.array[1])
                loadedPost.array[2].should.be.equal(post.array[2])

                table!.findColumnByName("id")!.type.should.be.equal("int64")
                table!.findColumnByName("name")!.type.should.be.equal("string")
                table!.findColumnByName("int64")!.type.should.be.equal("int64")
                table!
                    .findColumnByName("string")!
                    .type.should.be.equal("string")
                table!.findColumnByName("bytes")!.type.should.be.equal("bytes")
                table!
                    .findColumnByName("float64")!
                    .type.should.be.equal("float64")
                table!
                    .findColumnByName("numeric")!
                    .type.should.be.equal("numeric")
                table!.findColumnByName("date")!.type.should.be.equal("date")
                table!.findColumnByName("bool")!.type.should.be.equal("bool")
                table!.findColumnByName("date")!.type.should.be.equal("date")
                table!
                    .findColumnByName("timestamp")!
                    .type.should.be.equal("timestamp")
                table!.findColumnByName("json")!.type.should.be.equal("json")
                table!.findColumnByName("array")!.type.should.be.equal("string")
                table!.findColumnByName("array")!.isArray.should.be.true
            }),
        ))

    it("all types should work correctly - persist and hydrate when options are specified on columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(PostWithOptions)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post_with_options")
                await queryRunner.release()

                const post = new PostWithOptions()
                post.id = 1
                post.string = "This is string"
                post.bytes = Buffer.from("This is bytes")
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({ id: 1 }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.string.should.be.equal(post.string)
                loadedPost.bytes
                    .toString()
                    .should.be.equal(post.bytes.toString())

                table!.findColumnByName("id")!.type.should.be.equal("int64")
                table!
                    .findColumnByName("string")!
                    .type.should.be.equal("string")
                table!.findColumnByName("string")!.length!.should.be.equal("50")
                table!.findColumnByName("bytes")!.type.should.be.equal("bytes")
                table!.findColumnByName("bytes")!.length!.should.be.equal("50")
            }),
        ))

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository =
                    connection.getRepository(PostWithoutTypes)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post_without_types")
                await queryRunner.release()

                const post = new PostWithoutTypes()
                post.id = 1
                post.name = "Post"
                post.bool = true
                post.bytes = Buffer.from("A")
                post.timestamp = new Date()
                post.timestamp.setMilliseconds(0)
                await postRepository.save(post)

                const loadedPost = (await postRepository.findOneBy({ id: 1 }))!
                loadedPost.id.should.be.equal(post.id)
                loadedPost.name.should.be.equal(post.name)
                loadedPost.bool.should.be.equal(post.bool)
                loadedPost.bytes
                    .toString()
                    .should.be.equal(post.bytes.toString())
                loadedPost.timestamp
                    .valueOf()
                    .should.be.equal(post.timestamp.valueOf())

                table!.findColumnByName("id")!.type.should.be.equal("int64")
                table!.findColumnByName("name")!.type.should.be.equal("string")
                table!.findColumnByName("bool")!.type.should.be.equal("bool")
                table!.findColumnByName("bytes")!.type.should.be.equal("bytes")
                table!
                    .findColumnByName("timestamp")!
                    .type.should.be.equal("timestamp")
            }),
        ))
})
