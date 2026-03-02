import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop exclusion constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"], // Only PostgreSQL supports exclusion constraints.
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop exclusion constraint and revert drop", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

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
})
