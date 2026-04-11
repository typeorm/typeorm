import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { PostDetails } from "./entity/PostDetails"

describe("cascades > should insert by cascades from both sides", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert by cascades from owner side", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // first create details but don't save them because they will be saved by cascades
                const details = new PostDetails()
                details.keyword = "post-1"

                // then create and save a post with details
                const post = new Post()
                post.title = "Hello Post #1"
                post.details = details
                await connection.manager.save(post)

                // now check
                const posts = await connection.manager.find(Post, {
                    relations: {
                        details: true,
                    },
                })

                expect(posts).to.eql([
                    {
                        key: post.key,
                        title: post.title,
                        details: {
                            keyword: "post-1",
                        },
                    },
                ])
            }),
        ))

    it("should insert by cascades from inverse side", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.title = "Hello Post #1"

                const details = new PostDetails()
                details.keyword = "post-1"
                details.post = post

                await connection.manager.save(details)

                const loadedDetails = await connection.manager.find(
                    PostDetails,
                    {
                        relations: {
                            post: true,
                        },
                    },
                )

                expect(loadedDetails).to.eql([
                    {
                        keyword: "post-1",
                        post: {
                            key: post.key,
                            title: "Hello Post #1",
                        },
                    },
                ])
            }),
        ))
})
