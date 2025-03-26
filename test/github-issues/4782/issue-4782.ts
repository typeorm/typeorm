import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #4782 mariadb driver wants to recreate create/update date columns CURRENT_TIMESTAMP(6) === current_timestamp(6)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                // logging: true,
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not want to execute migrations twice", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sql1 = await connection.driver.createSchemaBuilder().log()
                expect(sql1.upQueries).to.eql([])
            }),
        ))
})
