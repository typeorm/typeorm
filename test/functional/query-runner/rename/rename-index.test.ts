import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { TableIndex } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { makeTable } from "./rename-helpers"

describe("query runner > rename index", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [
                "postgres",
                "cockroachdb",
                "mssql",
                "oracle",
                "mysql",
                "mariadb",
                "sap",
            ],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should rename an index in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await makeTable(dataSource, "rc_index")
                try {
                    await queryRunner.createIndex(
                        "rc_index",
                        new TableIndex({
                            name: "idx_old",
                            columnNames: ["a"],
                        }),
                    )

                    let table = await queryRunner.getTable("rc_index")
                    expect(table?.indices.some((i) => i.name === "idx_old")).to
                        .be.true

                    // Drop setup DDL from the memory so `executeMemoryDownSql`
                    // below only reverts the rename, not the createTable or
                    // createIndex that preceded it.
                    queryRunner.clearSqlMemory()

                    await queryRunner.renameIndex!(
                        "rc_index",
                        "idx_old",
                        "idx_new",
                    )

                    table = await queryRunner.getTable("rc_index")
                    expect(table?.indices.some((i) => i.name === "idx_old")).to
                        .be.false
                    expect(table?.indices.some((i) => i.name === "idx_new")).to
                        .be.true

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("rc_index")
                    expect(table?.indices.some((i) => i.name === "idx_old")).to
                        .be.true
                    expect(table?.indices.some((i) => i.name === "idx_new")).to
                        .be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
