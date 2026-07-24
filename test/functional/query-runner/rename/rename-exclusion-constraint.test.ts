import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { TableExclusion } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { makeTable } from "./rename-helpers"

describe("query runner > rename exclusion constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        // Exclusion constraints are a Postgres-only feature.
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename an exclusion constraint in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await makeTable(dataSource, "rc_exclusion")
                try {
                    await queryRunner.createExclusionConstraint(
                        "rc_exclusion",
                        new TableExclusion({
                            name: "xcl_old",
                            expression: `USING gist ("a" WITH =)`,
                        }),
                    )

                    let table = await queryRunner.getTable("rc_exclusion")
                    expect(table?.exclusions.some((x) => x.name === "xcl_old"))
                        .to.be.true

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renameExclusionConstraint!(
                        "rc_exclusion",
                        "xcl_old",
                        "xcl_new",
                    )

                    table = await queryRunner.getTable("rc_exclusion")
                    expect(table?.exclusions.some((x) => x.name === "xcl_old"))
                        .to.be.false
                    expect(table?.exclusions.some((x) => x.name === "xcl_new"))
                        .to.be.true

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_exclusion")
                    expect(table?.exclusions.some((x) => x.name === "xcl_old"))
                        .to.be.true
                    expect(table?.exclusions.some((x) => x.name === "xcl_new"))
                        .to.be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
