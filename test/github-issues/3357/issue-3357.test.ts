import "reflect-metadata"
import { expect } from "chai"
import { Table } from "../../../src"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #3357 Postgres varchar length change migrations should not drop columns", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should alter varchar length without dropping existing data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "bug",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            },
                            {
                                name: "example",
                                type: "varchar",
                                length: "50",
                            },
                        ],
                    }),
                )

                await queryRunner.query(
                    `INSERT INTO "bug" ("id", "example") VALUES (1, 'kept')`,
                )
                queryRunner.clearSqlMemory()

                const table = await queryRunner.getTable("bug")
                const column = table!.findColumnByName("example")!
                const changedColumn = column.clone()
                changedColumn.length = "51"

                await queryRunner.changeColumn(table!, column, changedColumn)

                const queries = queryRunner
                    .getMemorySql()
                    .upQueries.map((query) => query.query)

                expect(queries).to.include(
                    `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(
                    queries.some((query) =>
                        query.includes(`DROP COLUMN "example"`),
                    ),
                ).to.be.false
                expect(queries.some((query) => query.includes(`ADD "example"`)))
                    .to.be.false

                const rows = await queryRunner.query(
                    `SELECT "example" FROM "bug" WHERE "id" = 1`,
                )
                expect(rows[0].example).to.equal("kept")

                await queryRunner.executeMemoryDownSql()

                const revertedTable = await queryRunner.getTable("bug")
                expect(
                    revertedTable!.findColumnByName("example")!.length,
                ).to.equal("50")

                await queryRunner.release()
            }),
        ))
})
