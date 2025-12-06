import "reflect-metadata"
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
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Test } from "./entity/Test"

describe("github issues > #2943 Inappropriate migration generated", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mariadb", "mysql"],
            entities: [Test],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not create migrations for unsigned numeric types with no specified width", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
