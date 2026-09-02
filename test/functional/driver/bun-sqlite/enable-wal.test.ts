import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("bun:sqlite driver > enable wal", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["bun-sqlite"],
            driverSpecific: {
                enableWAL: true,
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should set the journal mode as expected", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query("PRAGMA journal_mode")
                expect(result).to.eql([{ journal_mode: "wal" }])
            }),
        ))
})
