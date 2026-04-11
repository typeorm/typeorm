import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"

import { expect } from "chai"

import Post, { PostSchema } from "./entity/Post"
import PostTag, { PostTagSchema } from "./entity/PostTag"
import PostAttachment, { PostAttachmentSchema } from "./entity/PostAttachment"

describe("cascades > insert with composite primary key duplicate constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [PostSchema, PostTagSchema, PostAttachmentSchema],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("persisting the cascading entities should succeed", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                const postTag = new PostTag()
                post.tags = [postTag]

                await connection.manager.save(post, { reload: true })

                try {
                    await connection.manager.save(post)
                } catch (e) {
                    expect.fail("Second save had an exception: " + e.toString())
                }
            }),
        ))

    it("persisting the cascading entities without JoinColumn should succeed", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                const postAttachment = new PostAttachment()
                post.attachments = [postAttachment]

                await connection.manager.save(post, { reload: true })

                try {
                    await connection.manager.save(post)
                } catch (e) {
                    expect.fail("Second save had an exception: " + e.toString())
                }
            }),
        ))

    it("persisting the child entity should succeed", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()

                await connection.manager.save<Post>(post)

                const postTag = new PostTag()
                postTag.post = post

                await connection.manager.save(postTag, { reload: true })

                try {
                    await connection.manager.save(postTag)
                } catch (e) {
                    expect.fail("Second save had an exception: " + e.toString())
                }
            }),
        ))
})
