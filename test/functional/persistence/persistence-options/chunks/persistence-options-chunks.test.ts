import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"

describe("persistence > persistence options > chunks", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should save objects in chunks", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const posts: Post[] = []
                for (let i = 0; i < 25000; i++) {
                    // CI falls on Node 4 with 100000 rows
                    const post = new Post()
                    post.title = "Bakhrom " + i
                    post.description = "Hello" + i
                    posts.push(post)
                }
                await connection.manager.save(posts, { chunk: 5000 }) // CI falls on Node 4 with 10000 chunks
            }),
        ))
})
