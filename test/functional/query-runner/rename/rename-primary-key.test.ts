import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { Table, TableColumn } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("query runner > rename primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        // MySQL/MariaDB PKs are always named "PRIMARY" at the DB level — no
        // renameable identity. SAP HANA has no native PK rename.
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename a primary key constraint in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "rc_pk",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                    primaryKeyConstraintName: "pk_old",
                                }),
                                new TableColumn({
                                    name: "v",
                                    type: "int",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renamePrimaryKey!(
                        "rc_pk",
                        "pk_old",
                        "pk_new",
                    )

                    let table = await queryRunner.getTable("rc_pk")
                    expect(
                        table?.columns.find((c) => c.isPrimary)
                            ?.primaryKeyConstraintName,
                    ).to.equal("pk_new")

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_pk")
                    expect(
                        table?.columns.find((c) => c.isPrimary)
                            ?.primaryKeyConstraintName,
                    ).to.equal("pk_old")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
