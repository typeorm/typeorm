import "reflect-metadata"
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
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #7907 add support for mongodb driver v5", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should find the Post without throw error: Cannot read property 'prototype' of undefined", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                post.text = "This is a simple post"
                await postMongoRepository.save(post)

                const findPosts = async () => {
                    return postMongoRepository.find()
                }
                const posts = await findPosts()

                expect(findPosts).to.not.throw()
                expect(posts).to.have.lengthOf(1)
                expect(posts[0]).to.be.instanceOf(Post)
            }),
        ))
})
