import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("better-sqlite3 driver > enable wal", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    enableWAL: true,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("github issues > #9410 The better-sqlite3 driver should support the enableWal flag", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const result = await connection.query("PRAGMA journal_mode")

                expect(result).to.eql([{ journal_mode: "wal" }])
            }),
        ))
})
