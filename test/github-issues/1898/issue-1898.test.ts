import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
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

describe("github issues > #1898 Simple JSON breaking in @next", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sqlite", "better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly persist", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post()
                post.type = "post"
                await connection.getRepository(Post).save(post)
            }),
        ))
})
