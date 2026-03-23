import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #7907 add support for mongodb driver v5", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(async () => {
        // wait for all clients to get closed
        // this is a workaround for the error: MongoClientClosedError: Operation interrupted because client was closed
        await new Promise((resolve) => setTimeout(resolve, 1))
        await closeTestingConnections(dataSources)
    })

    it("should find the Post without throw error: Cannot read property 'prototype' of undefined", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

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
