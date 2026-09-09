import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Test } from "./entity/Test"
import { expect } from "chai"

describe("schema builder > idempotency > spatial precision", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Test],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // https://github.com/typeorm/typeorm/issues/12800
    it("should not generate migrations for spatial columns with precision participating in a composite index", async () => {
        await Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        )
    })
})
