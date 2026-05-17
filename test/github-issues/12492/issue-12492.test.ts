import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #12492 Postgres enum array column default callbacks are stringified instead of evaluated", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate correct column definition for default as function", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                const table = (await queryRunner.getTable("single_enum"))!
                const labels1Column = table.findColumnByName("labels1")
                const labels2Column = table.findColumnByName("labels2")

                expect(labels1Column!.default).to.equal("'VALUE2'")
                expect(labels2Column!.default).to.equal("ARRAY[]")
            }),
        ))
})
