import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > drop check constraint", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly drop check constraint and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(dataSource.driver)) return

                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                table!.checks.length.should.be.equal(1)

                await queryRunner.dropCheckConstraint(table!, table!.checks[0])

                table = await queryRunner.getTable("post")
                table!.checks.length.should.be.equal(0)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.checks.length.should.be.equal(1)

                await queryRunner.release()
            }),
        ))

    it("should not throw when dropping non-existent check constraint with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(dataSource.driver)) return

                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropCheckConstraint(
                    "post",
                    "non_existent_check",
                    true,
                )
                await queryRunner.release()
            }),
        ))
})
