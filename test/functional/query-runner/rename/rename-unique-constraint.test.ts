import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { TableUnique } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { makeTable } from "./rename-helpers"

describe("query runner > rename unique constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        // MySQL/MariaDB model uniques as indexes — covered by the
        // rename-index suite. SAP HANA has no standalone unique constraint
        // type (uniques are unique indexes).
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename a unique constraint in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await makeTable(dataSource, "rc_unique")
                try {
                    await queryRunner.createUniqueConstraint(
                        "rc_unique",
                        new TableUnique({
                            name: "uq_old",
                            columnNames: ["a", "b"],
                        }),
                    )

                    let table = await queryRunner.getTable("rc_unique")
                    expect(table?.uniques.some((u) => u.name === "uq_old")).to
                        .be.true

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renameUniqueConstraint!(
                        "rc_unique",
                        "uq_old",
                        "uq_new",
                    )

                    table = await queryRunner.getTable("rc_unique")
                    expect(table?.uniques.some((u) => u.name === "uq_old")).to
                        .be.false
                    expect(table?.uniques.some((u) => u.name === "uq_new")).to
                        .be.true

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_unique")
                    expect(table?.uniques.some((u) => u.name === "uq_old")).to
                        .be.true
                    expect(table?.uniques.some((u) => u.name === "uq_new")).to
                        .be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
