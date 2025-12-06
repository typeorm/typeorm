import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Test } from "./entity/Test"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("github issues > #7698 MariaDB STORED columns don't accept [NULL | NOT NULL]", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mariadb"],
            entities: [Test],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should not generate queries with NULL or NOT NULL for stored columns in mariadb", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                sqlInMemory.upQueries.length.should.be.greaterThan(0)
            }),
        ))
})
