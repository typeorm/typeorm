import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #9318 Change version query from SHOW server_version to SELECT version", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should have proper isGeneratedColumnsSupported value for postgres version", () => {
        dataSources.forEach((connection) => {
            const { isGeneratedColumnsSupported } =
                connection.driver as PostgresDriver
            const versionGreaterOfEqualTo12 =
                DriverUtils.isReleaseVersionOrGreater(connection.driver, "12.0")

            expect(isGeneratedColumnsSupported).to.eq(versionGreaterOfEqualTo12)
        })
    })
})
