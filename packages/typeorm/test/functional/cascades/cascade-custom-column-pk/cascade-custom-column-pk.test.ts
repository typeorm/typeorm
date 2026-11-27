import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("cascades > custom column primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("cascade insert with custom column name", function () {
        it("should unlink relation without cascade remove", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // create first post and category and save them
                    const post1 = new Post()
                    post1.title = "Hello Post #1"

                    const category1 = new Category()
                    category1.name = "Category saved by cascades #1"
                    category1.posts = [post1]

                    await dataSource.manager.save(category1)

                    category1.posts = []

                    await dataSource.manager.save(category1)

                    // now check
                    const posts = await dataSource.manager.find(Post, {
                        relations: {
                            category: true,
                        },
                        order: {
                            id: "ASC",
                        },
                    })

                    expect(posts).to.eql([
                        {
                            id: 1,
                            title: "Hello Post #1",
                            category: null,
                        },
                    ])
                }),
            ))
    })
})
