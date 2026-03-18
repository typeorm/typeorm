import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("sqlite driver > busy-timeout", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["better-sqlite3"],
            driverSpecific: {
                timeout: 2000,
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should set the busy_timeout as expected", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query("PRAGMA busy_timeout")
                expect(result).to.eql([{ timeout: 2000 }])
            }),
        ))
})
