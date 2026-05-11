import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #3357 postgres varchar length changes", () => {
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

                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "bug3357",
                            columns: [
                                {
                                    name: "example",
                                    type: "character varying",
                                    length: "50",
                                },
                            ],
                        }),
                        true,
                    )

                    const table = await queryRunner.getTable("bug3357")
                    const column = table!.findColumnByName("example")!
                    const changedColumn = column.clone()
                    changedColumn.length = "51"

                    queryRunner.enableSqlMemory()
                    await queryRunner.changeColumn(
                        table!,
                        column,
                        changedColumn,
                    )
                    const sqlInMemory = queryRunner.getMemorySql()

                    expect(
                        sqlInMemory.upQueries.map((query) => query.query),
                    ).to.eql([
                        'ALTER TABLE "bug3357" ALTER COLUMN "example" TYPE character varying(51)',
                    ])
                    expect(
                        sqlInMemory.downQueries.map((query) => query.query),
                    ).to.eql([
                        'ALTER TABLE "bug3357" ALTER COLUMN "example" TYPE character varying(50)',
                    ])
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should preserve varchar length when changing collation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "bug3357_collation",
                            columns: [
                                {
                                    name: "example",
                                    type: "character varying",
                                    length: "50",
                                },
                            ],
                        }),
                        true,
                    )

                    const table =
                        await queryRunner.getTable("bug3357_collation")
                    const column = table!.findColumnByName("example")!
                    const changedColumn = column.clone()
                    changedColumn.length = "51"
                    changedColumn.collation = "C"

                    queryRunner.enableSqlMemory()
                    await queryRunner.changeColumn(
                        table!,
                        column,
                        changedColumn,
                    )
                    const sqlInMemory = queryRunner.getMemorySql()

                    expect(
                        sqlInMemory.upQueries.map((query) => query.query),
                    ).to.eql([
                        'ALTER TABLE "bug3357_collation" ALTER COLUMN "example" TYPE character varying(51)',
                        'ALTER TABLE "bug3357_collation" ALTER COLUMN "example" TYPE character varying(51) COLLATE "C"',
                    ])
                    expect(
                        sqlInMemory.downQueries.map((query) => query.query),
                    ).to.eql([
                        'ALTER TABLE "bug3357_collation" ALTER COLUMN "example" TYPE character varying(50)',
                        'ALTER TABLE "bug3357_collation" ALTER COLUMN "example" TYPE character varying(50) COLLATE pg_catalog."default"',
                    ])
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
