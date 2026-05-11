import "reflect-metadata"
import { expect } from "chai"
import { Table } from "../../../src"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #3357 postgres column length changes should not recreate columns", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should alter varchar length without dropping and adding the column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "bug",
                        columns: [
                            {
                                name: "example",
                                type: "character varying",
                                length: "50",
                            },
                        ],
                    }),
                )

                await queryRunner.query(`INSERT INTO "bug"("example") VALUES ($1)`, [
                    "kept value",
                ])

                const table = await queryRunner.getTable("bug")
                const oldColumn = table!.findColumnByName("example")!
                const newColumn = oldColumn.clone()
                newColumn.length = "51"

                await queryRunner.changeColumn(table!, oldColumn, newColumn)

                expect(
                    queryRunner.getMemorySql().upQueries.map((q) => q.query),
                ).to.include(
                    'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
                )
                expect(
                    queryRunner
                        .getMemorySql()
                        .upQueries.some((q) => q.query.includes("DROP COLUMN")),
                ).to.be.false
                expect(
                    queryRunner
                        .getMemorySql()
                        .upQueries.some((q) => q.query.includes("ADD")),
                ).to.be.false

                const rows = await queryRunner.query(
                    `SELECT "example" FROM "bug"`,
                )
                expect(rows[0].example).to.equal("kept value")

                await queryRunner.release()
            }),
        ))
})
