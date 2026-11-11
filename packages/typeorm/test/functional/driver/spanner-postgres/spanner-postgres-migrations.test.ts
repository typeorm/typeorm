import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { MigrationInterface } from "../../../../src/migration/MigrationInterface"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { Table } from "../../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../../src/schema-builder/table/TableColumn"
import { TableForeignKey } from "../../../../src/schema-builder/table/TableForeignKey"
import { TableIndex } from "../../../../src/schema-builder/table/TableIndex"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { spyOnSchemaUpdates } from "./spanner-postgres-test-utils"

/**
 * Creates two tables with indexes and a foreign key: a migration that Spanner
 * runs fastest as a single schema update.
 */
class CreateTables1700000000001 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        for (const name of ["pgm_a", "pgm_b"]) {
            await queryRunner.createTable(
                new Table({
                    name,
                    columns: [
                        {
                            name: "id",
                            type: "varchar",
                            length: "36",
                            isPrimary: true,
                        },
                        {
                            name: "ref",
                            type: "varchar",
                            length: "36",
                            isNullable: true,
                        },
                        { name: "v1", type: "bigint", isNullable: true },
                    ],
                }),
            )
            await queryRunner.createIndex(
                name,
                new TableIndex({
                    name: `IDX_${name}_v1`,
                    columnNames: ["v1"],
                }),
            )
        }
        await queryRunner.query(
            `CREATE INDEX "IDX_pgm_a_raw" ON "pgm_a" ("id", "v1")`,
        )
        await queryRunner.createForeignKey(
            "pgm_b",
            new TableForeignKey({
                name: "FK_pgm_b_ref",
                columnNames: ["ref"],
                referencedTableName: "pgm_a",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_pgm_a_raw"`)
        await queryRunner.dropForeignKey("pgm_b", "FK_pgm_b_ref")
        await queryRunner.dropTable("pgm_b")
        await queryRunner.dropTable("pgm_a")
    }
}

/**
 * Mixes DDL and DML: the DDL is sent before the DML that needs it.
 */
class AddColumnAndSeed1700000000002 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "pgm_a",
            new TableColumn({
                name: "added",
                type: "bigint",
                isNullable: true,
            }),
        )
        await queryRunner.query(
            `INSERT INTO "pgm_a" ("id", "added") VALUES ('seed', 1)`,
        )
        await queryRunner.addColumn(
            "pgm_b",
            new TableColumn({
                name: "after_dml",
                type: "bigint",
                isNullable: true,
            }),
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("pgm_b", "after_dml")
        await queryRunner.query(`DELETE FROM "pgm_a" WHERE "id" = 'seed'`)
        await queryRunner.dropColumn("pgm_a", "added")
    }
}

/**
 * Queues a table and fails before the DDL is sent.
 */
class FailAfterCreateTable1700000000003 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "pgm_failed",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "36",
                        isPrimary: true,
                    },
                ],
            }),
        )
        throw new Error("migration failed")
    }

    async down(): Promise<void> {}
}

describe("driver > spanner-postgres > migrations", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            migrations: [
                CreateTables1700000000001,
                AddColumnAndSeed1700000000002,
            ],
            dropSchema: true,
            // Spanner runs DDL outside of transactions
            driverSpecific: { migrationsTransactionMode: "none" },
        })
    })
    after(() => closeTestingConnections(dataSources))

    const forEachDataSource = (fn: (dataSource: DataSource) => Promise<any>) =>
        Promise.all(dataSources.map(fn))

    const tableState = async (dataSource: DataSource) => {
        const queryRunner = dataSource.createQueryRunner()
        try {
            const tables = await queryRunner.getTables(["pgm_a", "pgm_b"])
            return Object.fromEntries(
                tables.map((table) => [
                    table.name,
                    {
                        columns: table.columns.map((c) => c.name).sort(),
                        indices: table.indices.length,
                        foreignKeys: table.foreignKeys.length,
                    },
                ]),
            )
        } finally {
            await queryRunner.release()
        }
    }

    it("should run migrations without a transaction, up and down", () =>
        forEachDataSource(async (dataSource) => {
            const spy = spyOnSchemaUpdates(dataSource)
            try {
                const ran = await dataSource.runMigrations({
                    transaction: "none",
                })
                expect(ran.map((migration) => migration.name)).to.deep.equal([
                    "CreateTables1700000000001",
                    "AddColumnAndSeed1700000000002",
                ])

                // the tables, their indexes and the foreign key are one schema update
                const batch = spy.statements.find((statements) =>
                    statements.some((s) => /CREATE TABLE "pgm_a"/.test(s)),
                )!
                expect(
                    batch.filter((s) => s.startsWith("CREATE TABLE")),
                ).to.have.length(2)
                expect(batch.filter((s) => /INDEX/.test(s))).to.have.length(3)
                expect(
                    batch.filter((s) => /FOREIGN KEY/.test(s)),
                ).to.have.length(1)
            } finally {
                spy.restore()
            }

            expect(await tableState(dataSource)).to.deep.equal({
                pgm_a: {
                    columns: ["added", "id", "ref", "v1"],
                    indices: 2,
                    foreignKeys: 0,
                },
                pgm_b: {
                    columns: ["after_dml", "id", "ref", "v1"],
                    indices: 1,
                    foreignKeys: 1,
                },
            })
            expect(
                await dataSource.query(`SELECT "id" FROM "pgm_a"`),
            ).to.deep.equal([{ id: "seed" }])

            // the last migration by timestamp is the first one undone, as the
            // ids of the migrations table are not sequential
            await dataSource.undoLastMigration({ transaction: "none" })
            expect(await tableState(dataSource)).to.deep.equal({
                pgm_a: {
                    columns: ["id", "ref", "v1"],
                    indices: 2,
                    foreignKeys: 0,
                },
                pgm_b: {
                    columns: ["id", "ref", "v1"],
                    indices: 1,
                    foreignKeys: 1,
                },
            })
            expect(
                await dataSource.query(`SELECT "id" FROM "pgm_a"`),
            ).to.have.length(0)
            expect(
                (
                    await dataSource.query(
                        `SELECT "name" FROM "migrations" ORDER BY "timestamp"`,
                    )
                ).map((row: any) => row.name),
            ).to.deep.equal(["CreateTables1700000000001"])

            await dataSource.undoLastMigration({ transaction: "none" })
            expect(await tableState(dataSource)).to.deep.equal({})
            expect(
                await dataSource.query(
                    `SELECT COUNT(*) AS n FROM "migrations"`,
                ),
            ).to.deep.equal([{ n: 0 }])
        }))
})

describe("driver > spanner-postgres > failed migrations", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            migrations: [FailAfterCreateTable1700000000003],
            dropSchema: true,
            driverSpecific: { migrationsTransactionMode: "none" },
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should not send the DDL queued by a failed migration", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await expect(
                    dataSource.runMigrations({ transaction: "none" }),
                ).to.be.rejectedWith("migration failed")

                const queryRunner = dataSource.createQueryRunner()
                try {
                    expect(await queryRunner.hasTable("pgm_failed")).to.equal(
                        false,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
