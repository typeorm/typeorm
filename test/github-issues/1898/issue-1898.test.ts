import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #1898 Simple JSON breaking in @next", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly persist", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.type = "post"
                await connection.getRepository(Post).save(post)
            }),
        ))
})
