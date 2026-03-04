import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("github issues > #151 joinAndSelect can't find entity from inverse side of relation", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should cascade persist successfully", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const category = new Category()
                category.name = "post category"

                const post = new Post()
                post.title = "Hello post"
                post.category = category

                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOne(Post, {
                    where: {
                        id: 1,
                    },
                    join: {
                        alias: "post",
                        innerJoinAndSelect: {
                            category: "post.category",
                        },
                    },
                })

                expect(loadedPost).not.to.be.null
                loadedPost!.should.be.eql({
                    id: 1,
                    title: "Hello post",
                    category: {
                        id: 1,
                        name: "post category",
                    },
                })
            }),
        ))
})
