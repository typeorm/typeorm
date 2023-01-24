import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Example } from "./entity/Example"

describe("github issues > #9528 In the old version, Huawei PRAGMA table_xinfo is incompatible", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example],
                schemaCreate: true,
                dropSchema: true,
                /* Test not eligible for better-sql where binding Dates is impossible */
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))

    after(() => closeTestingConnections(connections))

    it("should has columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qr = connection.createQueryRunner()

                expect(await qr.hasColumn("example", "id")).to.be.true
                expect(await qr.hasColumn("example", "text")).to.be.true
            }),
        ))

    it("should not has columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qr = connection.createQueryRunner()

                expect(await qr.hasColumn("example", "invalidColumn")).to.be
                    .false
            }),
        ))
})
