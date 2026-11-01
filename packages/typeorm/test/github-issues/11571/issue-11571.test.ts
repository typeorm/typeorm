import { expect } from "chai"
import type { DataSource } from "../../../src"
import { VersionUtils } from "../../../src/util/VersionUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Application } from "./entity/Application"

describe("github issues > #11571 uuid_generate_v4 function for postgres migration", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Application],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should use built-in gen_random_uuid() on Postgres 13+ when no uuidExtension is set", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    !VersionUtils.isGreaterOrEqual(
                        dataSource.driver.version,
                        "13.0",
                    )
                )
                    return

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const createTable = sqlInMemory.upQueries.find((query) =>
                    query.query.startsWith(`CREATE TABLE "application"`),
                )!
                expect(createTable.query).to.contain(
                    `"id" uuid NOT NULL DEFAULT gen_random_uuid()`,
                )
            }),
        ))
})
