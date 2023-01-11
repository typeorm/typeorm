import "reflect-metadata"
import { Post } from "./entity/Post"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source"
import { LegacyOracleNamingStrategy } from "../../../../../src/naming-strategy/LegacyOracleNamingStrategy"

describe("LegacyOracleNamingStrategy > create table using this naming strategy", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
                namingStrategy: new LegacyOracleNamingStrategy("hash"),
            })),
    )
    // without reloadTestingDatabases(connections) -> tables should be created later
    after(() => closeTestingConnections(connections))

    it("should create the table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post: Post = new Post()
                post.veryLongveryLongveryLongveryLongveryLongveryLongveryLongName =
                    "name"
                await expect(connection.manager.save(post)).to.be.fulfilled
            }),
        ))
})
