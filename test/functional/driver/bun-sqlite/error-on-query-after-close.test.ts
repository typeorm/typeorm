import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("bun:sqlite driver > throws an error when queried after closing connection", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["bun-sqlite"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should throw", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.destroy()
                await expect(
                    dataSource.query("select * from sqlite_master;"),
                ).to.rejectedWith("The database connection is not open")
            }),
        ))
})
