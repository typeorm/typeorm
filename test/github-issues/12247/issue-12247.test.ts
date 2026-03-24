import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Todo } from "./entity/Todo"

describe("github issues > #12247 Postgres migration repeatedly alters epoch default expressions", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "aurora-postgres", "cockroachdb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [Todo],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should not generate no-op ALTER COLUMN SET DEFAULT queries after schema sync", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.driver.createSchemaBuilder().build()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
            }),
        ))
})
