import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source"
import { LegacyOracleNamingStrategy } from "../../../../../src/naming-strategy/LegacyOracleNamingStrategy"

describe("LegacyOracleNamingStrategy > create table using this naming strategy", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
                namingStrategy: new LegacyOracleNamingStrategy("hash"),
            })),
    )
    // without reloadTestingDatabases(dataSources) -> tables should be created later
    after(() => closeTestingConnections(dataSources))

    it("should create the table", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await expect(reloadTestingDatabases([connection])).to.be
                    .fulfilled
            }),
        ))
})
