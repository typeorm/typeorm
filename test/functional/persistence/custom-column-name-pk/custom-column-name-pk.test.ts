import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("persistence > cascade operations with custom name", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    describe("cascade update", function () {
        it("should remove relation", () =>
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

                    posts.should.be.eql([
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
