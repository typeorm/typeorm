import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("sqlite driver > throws an error when queried after closing connection", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should throw", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.destroy()
                await expect(
                    connection.query("select * from sqlite_master;"),
                ).to.rejectedWith("The database connection is not open")
            }),
        ))
})
