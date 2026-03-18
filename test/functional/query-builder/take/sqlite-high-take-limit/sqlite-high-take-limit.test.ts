import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query-builder > take > sqlite high take limit", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"], // this issue only related to sqlite
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should not fail with too many SQL variables when take is 1000", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                for (let i = 0; i < 1000; i++) {
                    const post1 = new Post()
                    post1.title = "Hello Post #1"
                    await connection.manager.save(post1)
                }

                const loadedPosts = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "categories")
                    .take(1000)
                    .getMany()

                loadedPosts.length.should.be.equal(1000)
            }),
        ))
})
