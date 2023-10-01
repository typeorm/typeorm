import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Comment } from "./entity/Comment"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #10391 mongodb entities with nested arrays should be created correctly", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("can query entities in an empty database", async () => {
        for (const connection of connections) {
            const repository = connection.getMongoRepository(Post)

            const posts = await repository.find({})
            expect(posts).to.be.empty
        }
    })

    it("should save entities properly using entity pattern", async () => {
        for (const connection of connections) {
            const repository = connection.getMongoRepository(Post)

            const post = new Post()
            const comment = new Comment()
            comment.content = "Meow"
            post.comments = [comment]

            await repository.save(post)
            const posts = await repository.find({})
            posts.forEach((post) => expect(post).to.be.instanceof(Post))

            await repository.clear() // Cleanup
        }
    })

    it("should save entities properly using a mix of patterns, post-only", async () => {
        for (const connection of connections) {
            const repository = connection.getMongoRepository(Post)

            const post = repository.create()
            const comment = new Comment()
            comment.content = "Meow"
            post.comments = [comment]

            await repository.save(post)
            const posts = await repository.find({})
            posts.forEach((post) => expect(post).to.be.instanceof(Post))

            await repository.clear() // Cleanup
        }
    })

    it("should save entities properly using a mix of patterns, post-with-comment-field", async () => {
        for (const connection of connections) {
            const repository = connection.getMongoRepository(Post)

            const comment = new Comment()
            comment.content = "Meow"
            const post = repository.create({
                comments: [comment],
            })

            await repository.save(post)
            const posts = await repository.find({})
            posts.forEach((post) => expect(post).to.be.instanceof(Post))

            await repository.clear() // Cleanup
        }
    })

    it("should save entities properly using repository pattern", async () => {
        for (const connection of connections) {
            const repository = connection.getMongoRepository(Post)

            const post = repository.create({
                comments: [{ content: "Meow" }],
            })

            await repository.save(post)
            const posts = await repository.find({})
            posts.forEach((post) => expect(post).to.be.instanceof(Post))

            await repository.clear() // Cleanup
        }
    })
})
