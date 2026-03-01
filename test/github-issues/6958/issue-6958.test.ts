import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { expect } from "chai"

describe("github issues > #6958 Promises never get resolved in specific cases", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should release all used query runners upon disconnection", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const runner1 = connection.createQueryRunner()
                await runner1.query("SELECT 1 as foo;") // dummy query to ensure that a database connection is established
                const runner2 = connection.createQueryRunner()
                await runner2.query("SELECT 2 as foo;")

                await connection.destroy()

                expect(runner1.isReleased).to.be.true
                expect(runner2.isReleased).to.be.true
                expect(
                    (connection.driver as PostgresDriver).connectedQueryRunners
                        .length,
                ).to.equal(0)
            }),
        ))
})
