import "reflect-metadata"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TableExclusion } from "../../../src/schema-builder/table/TableExclusion"

describe("query runner > create exclusion constraint", () => {
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

    it("should correctly create exclusion constraint and revert creation", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                await queryRunner.createTable(
                    new Table({
                        name: "question",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            },
                            {
                                name: "name",
                                type: "varchar",
                            },
                            {
                                name: "description",
                                type: "varchar",
                            },
                            {
                                name: "version",
                                type: "int",
                            },
                        ],
                    }),
                    true,
                )

                // clear sqls in memory to avoid removing tables when down queries executed.
                queryRunner.clearSqlMemory()

                const driver = connection.driver
                const exclusion1 = new TableExclusion({
                    expression: `USING gist (${driver.escape("name")} WITH =)`,
                })
                const exclusion2 = new TableExclusion({
                    expression: `USING gist (${driver.escape("id")} WITH =)`,
                })
                await queryRunner.createExclusionConstraints("question", [
                    exclusion1,
                    exclusion2,
                ])

                let table = await queryRunner.getTable("question")
                table!.exclusions.length.should.be.equal(2)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("question")
                table!.exclusions.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))
})
