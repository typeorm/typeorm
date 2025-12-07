import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
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

describe("query runner > create and drop schema", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres", "sap"],
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create and drop schema and revert it", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                await queryRunner.createSchema("myTestSchema", true)
                let hasSchema = await queryRunner.hasSchema("myTestSchema")
                hasSchema.should.be.true

                await queryRunner.dropSchema("myTestSchema")
                hasSchema = await queryRunner.hasSchema("myTestSchema")
                hasSchema.should.be.false

                await queryRunner.executeMemoryDownSql()

                hasSchema = await queryRunner.hasSchema("myTestSchema")
                hasSchema.should.be.false

                await queryRunner.release()
            }),
        ))
})
