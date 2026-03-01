import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > create and drop schema", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres", "sap"],
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly create and drop schema and revert it", () =>
        Promise.all(
            dataSources.map(async (connection) => {
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
