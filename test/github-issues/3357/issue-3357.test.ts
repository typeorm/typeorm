import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #3357 postgres varchar length change should preserve data", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("alters varchar length without dropping and recreating the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const tableName = "issue_3357_post"

                try {
                    await queryRunner.createTable(
                        new Table({
                            name: tableName,
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
                                    isNullable: true,
                                },
                            ],
                        }),
                        true,
                    )

                    await queryRunner.query(
                        `INSERT INTO "${tableName}"("id", "example") VALUES (1, 'typeorm')`,
                    )
                    queryRunner.clearSqlMemory()

                    const table = await queryRunner.getTable(tableName)
                    const exampleColumn = table!.findColumnByName("example")!
                    const changedExampleColumn = exampleColumn.clone()
                    changedExampleColumn.length = "51"

                    await queryRunner.changeColumn(
                        table!,
                        exampleColumn,
                        changedExampleColumn,
                    )

                    const rows = await queryRunner.query(
                        `SELECT "example" FROM "${tableName}" WHERE "id" = 1`,
                    )
                    expect(rows[0].example).to.equal("typeorm")

                    const upQueries = queryRunner
                        .getMemorySql()
                        .upQueries.map((query) => query.query)

                    expect(
                        upQueries.some(
                            (query) =>
                                query.includes(
                                    'ALTER COLUMN "example" TYPE',
                                ) && query.includes("(51)"),
                        ),
                    ).to.be.true
                    expect(
                        upQueries.some((query) =>
                            query.includes('DROP COLUMN "example"'),
                        ),
                    ).to.be.false
                    expect(
                        upQueries.some((query) =>
                            query.includes('ADD "example"'),
                        ),
                    ).to.be.false
                } finally {
                    await queryRunner.dropTable(tableName, true)
                    await queryRunner.release()
                }
            }),
        ))
})
