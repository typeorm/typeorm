import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop exclusion constraint", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"], // Only PostgreSQL supports exclusion constraints.
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly drop exclusion constraint and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                table!.exclusions.length.should.be.equal(1)

                await queryRunner.dropExclusionConstraint(
                    table!,
                    table!.exclusions[0],
                )

                table = await queryRunner.getTable("post")
                table!.exclusions.length.should.be.equal(0)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.exclusions.length.should.be.equal(1)

                await queryRunner.release()
            }),
        ))

    it("should not throw when dropping non-existent exclusion constraint with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropExclusionConstraint(
                    "post",
                    "non_existent_exclusion",
                    true,
                )
                await queryRunner.release()
            }),
        ))
})
