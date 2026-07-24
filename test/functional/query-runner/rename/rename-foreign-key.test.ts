import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { Table, TableColumn, TableForeignKey } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("query runner > rename foreign key", () => {
    let dataSources: DataSource[]
    before(async () => {
        // MySQL/MariaDB have no native FK rename — falls back to drop/create
        // via the default path. SAP HANA similarly has no native FK rename.
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename a foreign key in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "rc_fk_parent",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                }),
                            ],
                        }),
                        true,
                    )
                    await queryRunner.createTable(
                        new Table({
                            name: "rc_fk_child",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                }),
                                new TableColumn({
                                    name: "parent_id",
                                    type: "int",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )
                    await queryRunner.createForeignKey(
                        "rc_fk_child",
                        new TableForeignKey({
                            name: "fk_old",
                            columnNames: ["parent_id"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "rc_fk_parent",
                        }),
                    )

                    let table = await queryRunner.getTable("rc_fk_child")
                    expect(table?.foreignKeys.some((f) => f.name === "fk_old"))
                        .to.be.true

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renameForeignKey!(
                        "rc_fk_child",
                        "fk_old",
                        "fk_new",
                    )

                    table = await queryRunner.getTable("rc_fk_child")
                    expect(table?.foreignKeys.some((f) => f.name === "fk_old"))
                        .to.be.false
                    expect(table?.foreignKeys.some((f) => f.name === "fk_new"))
                        .to.be.true

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_fk_child")
                    expect(table?.foreignKeys.some((f) => f.name === "fk_old"))
                        .to.be.true
                    expect(table?.foreignKeys.some((f) => f.name === "fk_new"))
                        .to.be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
