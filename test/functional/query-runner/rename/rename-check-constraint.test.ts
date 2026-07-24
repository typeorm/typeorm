import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { TableCheck } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { makeTable } from "./rename-helpers"

describe("query runner > rename check constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        // CockroachDB check-constraint names are system-generated so a test
        // that seeds with an explicit name has nothing to match against.
        // MySQL/MariaDB's TypeORM driver doesn't surface check constraints.
        // SAP HANA has no native RENAME CONSTRAINT (no true rename).
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "mssql", "oracle"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename a check constraint in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await makeTable(dataSource, "rc_check")
                try {
                    await queryRunner.createCheckConstraint(
                        "rc_check",
                        new TableCheck({
                            name: "chk_old",
                            expression: `${dataSource.driver.escape("a")} > 0`,
                        }),
                    )

                    let table = await queryRunner.getTable("rc_check")
                    expect(table?.checks.some((c) => c.name === "chk_old")).to
                        .be.true

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renameCheckConstraint!(
                        "rc_check",
                        "chk_old",
                        "chk_new",
                    )

                    table = await queryRunner.getTable("rc_check")
                    expect(table?.checks.some((c) => c.name === "chk_old")).to
                        .be.false
                    expect(table?.checks.some((c) => c.name === "chk_new")).to
                        .be.true

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_check")
                    expect(table?.checks.some((c) => c.name === "chk_old")).to
                        .be.true
                    expect(table?.checks.some((c) => c.name === "chk_new")).to
                        .be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
