import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #3357 postgres column length changes should not drop columns", () => {
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

    it("should alter varchar length without dropping data", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "bug",
                            columns: [
                                {
                                    name: "id",
                                    type: "integer",
                                    isPrimary: true,
                                },
                                {
                                    name: "example",
                                    type: "character varying",
                                    length: "50",
                                },
                            ],
                        }),
                    )

                    await queryRunner.query(
                        `INSERT INTO "bug"("id", "example") VALUES (1, 'preserve-me')`,
                    )

                    const table = await queryRunner.getTable("bug")
                    const oldColumn = table!.findColumnByName("example")!
                    const newColumn = oldColumn.clone()
                    newColumn.length = "51"

                    queryRunner.enableSqlMemory()
                    await queryRunner.changeColumn(table!, oldColumn, newColumn)

                    const sqlInMemory = queryRunner.getMemorySql()
                    expect(
                        sqlInMemory.upQueries.map(({ query }) => query),
                    ).to.eql([
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                    ])
                    expect(
                        sqlInMemory.downQueries.map(({ query }) => query),
                    ).to.eql([
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)`,
                    ])

                    await queryRunner.executeMemoryUpSql()

                    const rows = await queryRunner.query(
                        `SELECT "example" FROM "bug" WHERE "id" = 1`,
                    )
                    expect(rows[0].example).to.equal("preserve-me")
                } finally {
                    queryRunner.disableSqlMemory()
                    await queryRunner.release()
                }
            }),
        ))
})
