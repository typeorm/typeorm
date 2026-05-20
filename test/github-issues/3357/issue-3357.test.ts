import "reflect-metadata"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("github issues > #3357", () => {
    let dataSources: DataSource[] = []

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("changes varchar length without dropping and recreating the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "issue_3357_bug",
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
                    `INSERT INTO "issue_3357_bug"("id", "example") VALUES (1, 'value')`,
                )

                const table = await queryRunner.getTable("issue_3357_bug")
                const oldColumn = table!.findColumnByName("example")!
                const newColumn = oldColumn.clone()
                newColumn.length = "51"

                queryRunner.enableSqlMemory()
                await queryRunner.changeColumn(table!, oldColumn, newColumn)
                const upQueries = queryRunner
                    .getMemorySql()
                    .upQueries.map(({ query }) => query)
                queryRunner.disableSqlMemory()

                expect(upQueries).to.eql([
                    `ALTER TABLE "issue_3357_bug" ALTER COLUMN "example" TYPE character varying(51)`,
                ])
                expect(upQueries.join("\n")).not.to.contain("DROP COLUMN")
                expect(upQueries.join("\n")).not.to.contain("ADD")

                await queryRunner.changeColumn(table!, oldColumn, newColumn)

                const rows = await queryRunner.query(
                    `SELECT "example" FROM "issue_3357_bug" WHERE "id" = 1`,
                )
                expect(rows).to.eql([{ example: "value" }])

                const changedTable =
                    await queryRunner.getTable("issue_3357_bug")
                expect(
                    changedTable!.findColumnByName("example")!.length,
                ).to.equal("51")

                await queryRunner.release()
            }),
        ))
})
