import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { Table } from "../../../src/schema-builder/table/Table"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #3357 Postgres varchar length migrations alter column type", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should alter varchar length without dropping and recreating the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "bug",
                        columns: [
                            {
                                name: "example",
                                type: "varchar",
                                length: "50",
                            },
                        ],
                    }),
                )

                const table = await queryRunner.getTable("bug")
                const column = table!.findColumnByName("example")!
                const newColumn = column.clone()
                newColumn.length = "51"

                queryRunner.enableSqlMemory()
                await queryRunner.changeColumn(table!, column, newColumn)

                const upQueries = queryRunner
                    .getMemorySql()
                    .upQueries.map((query) => query.query)

                expect(upQueries).to.deep.equal([
                    'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
                ])
                expect(upQueries).not.to.deep.include(
                    'ALTER TABLE "bug" DROP COLUMN "example"',
                )
                expect(upQueries).not.to.deep.include(
                    'ALTER TABLE "bug" ADD "example" character varying(51)',
                )

                await queryRunner.release()
            }),
        ))
})
