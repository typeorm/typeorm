import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"

/**
 * @see https://github.com/typeorm/typeorm/issues/3357
 */
describe("github issues > #3357 alter column length without drop+add", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("postgres: length-only change uses ALTER COLUMN TYPE and keeps data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qr = dataSource.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "issue_3357_bug",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "example",
                                type: "varchar",
                                length: "50",
                            },
                        ],
                    }),
                    true,
                )

                await qr.query(
                    `INSERT INTO "issue_3357_bug" ("example") VALUES ('hello-3357')`,
                )

                const table = await qr.getTable("issue_3357_bug")
                const oldCol = table!.findColumnByName("example")!
                const newCol = oldCol.clone()
                newCol.length = "51"

                await qr.enableSqlMemory()
                await qr.changeColumn(table!, oldCol, newCol)
                const sql = qr.getMemorySql()
                const upSql = sql.upQueries.map((q) => q.query).join("\n")
                qr.clearSqlMemory()
                await qr.disableSqlMemory()

                // Apply for real (memory mode did not execute against DB)
                const table2 = await qr.getTable("issue_3357_bug")
                const oldCol2 = table2!.findColumnByName("example")!
                const newCol2 = oldCol2.clone()
                newCol2.length = "51"
                await qr.changeColumn(table2!, oldCol2, newCol2)

                expect(upSql.toUpperCase()).to.not.include("DROP COLUMN")
                expect(upSql.toUpperCase()).to.include("ALTER COLUMN")
                expect(upSql.toUpperCase()).to.include("TYPE")
                expect(upSql).to.match(/character varying\(51\)|varchar\(51\)/i)

                const rows: { example: string }[] = await qr.query(
                    `SELECT "example" FROM "issue_3357_bug"`,
                )
                expect(rows).to.have.length(1)
                expect(rows[0].example).to.equal("hello-3357")

                const updated = await qr.getTable("issue_3357_bug")
                expect(updated!.findColumnByName("example")!.length).to.equal(
                    "51",
                )

                await qr.dropTable("issue_3357_bug")
                await qr.release()
            }),
        ))
})
