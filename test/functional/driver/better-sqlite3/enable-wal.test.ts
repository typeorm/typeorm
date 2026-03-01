import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("sqlite driver > enable wal", () => {
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

    it("should set the journal mode as expected", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // if we come this far, test was successful as a connection was established
                const result = await connection.query("PRAGMA journal_mode")

                expect(result).to.eql([{ journal_mode: "wal" }])
            }),
        ))
})
