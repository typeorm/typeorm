import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source"

describe("LegacyOracleNamingStrategy > create table using default naming strategy", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
            })),
    )
    // without reloadTestingDatabases(connections) -> tables should be created later
    after(() => closeTestingConnections(connections))

    it("should not create the table and fail due to ORA-00972", () =>
        Promise.all(
            connections.map(async (connection) => {
                await expect(
                    reloadTestingDatabases([connection]),
                ).to.be.rejectedWith(/ORA-00972/gi)
            }),
        ))
})
