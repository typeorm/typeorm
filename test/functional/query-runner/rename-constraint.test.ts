import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    Table,
    TableCheck,
    TableColumn,
    TableExclusion,
    TableForeignKey,
    TableIndex,
    TableUnique,
} from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > rename constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function makeTable(dataSource: DataSource, tableName: string) {
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.createTable(
            new Table({
                name: tableName,
                columns: [
                    new TableColumn({
                        name: "id",
                        type: "int",
                        isPrimary: true,
                    }),
                    new TableColumn({
                        name: "a",
                        type: "int",
                        isNullable: true,
                    }),
                    new TableColumn({
                        name: "b",
                        type: "int",
                        isNullable: true,
                    }),
                ],
            }),
            true,
        )
        return queryRunner
    }

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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rename a foreign key in place", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await makeTable(dataSource, "rc_fk_parent")
                try {
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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rename a check constraint in place (Postgres and MSSQL — CockroachDB check names are generated)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "cockroachdb") return
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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rename an exclusion constraint in place (Postgres only)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") return
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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

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

                    await queryRunner.renamePrimaryKey!(
                        "rc_pk",
                        "pk_old",
                        "pk_new",
                    )

                    const table = await queryRunner.getTable("rc_pk")
                    expect(
                        table?.columns.find((c) => c.isPrimary)
                            ?.primaryKeyConstraintName,
                    ).to.equal("pk_new")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
