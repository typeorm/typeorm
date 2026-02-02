import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../src"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #9318 Change version query from SHOW server_version to SELECT version", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should have proper isGeneratedColumnsSupported value for postgres version", () => {
        connections.forEach((connection) => {
            const { isGeneratedColumnsSupported } =
                connection.driver as PostgresDriver
            const versionGreaterOfEqualTo12 =
                DriverUtils.isReleaseVersionOrGreater(connection.driver, "12.0")

            expect(isGeneratedColumnsSupported).to.eq(versionGreaterOfEqualTo12)
        })
    })
})
