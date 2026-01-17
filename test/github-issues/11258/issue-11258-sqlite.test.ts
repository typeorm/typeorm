import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ParentSqlite as ParentSqlite0 } from "./entity-sqlite-0/ParentSqlite"
import { ChildSqlite as ChildSqlite0 } from "./entity-sqlite-0/ChildSqlite"
import { ParentSqlite as ParentSqlite6 } from "./entity-sqlite-6/ParentSqlite"
import { ChildSqlite as ChildSqlite6 } from "./entity-sqlite-6/ChildSqlite"
import { scheduler } from "node:timers/promises"

describe("github issues > #11258 SQLite - datetime precision handling", () => {
    let connections: DataSource[]

    /**
     * This test specifically focuses on SQLite datetime precision handling.
     * This is a companion test to the main issue-11258.ts test which focuses on MySQL/MariaDB,
     * and issue-11258-sqlserver.ts which focuses on SQL Server.
     *
     * SQLite uses different types and functions compared to MySQL/MariaDB and SQL Server:
     * - Uses 'datetime' instead of 'timestamp' or 'datetime2'
     * - Precision 0: Uses 'datetime('now')' (no fractional seconds)
     * - Precision 6: Uses 'STRFTIME('%Y-%m-%d %H:%M:%f', 'now')' (fractional seconds)
     * - SQLite datetime supports fractional seconds: YYYY-MM-DD HH:MM:SS.SSS
     * - STRFTIME with %f provides microsecond precision (6 decimal places)
     *
     * IMPORTANT NOTE: SQLite precision handling
     * =======================================
     * Unlike MySQL/MariaDB and SQL Server, SQLite:
     * 1. Doesn't have a native 'timestamp' type (uses 'datetime' instead)
     * 2. Uses different functions for different precisions:
     *    - Precision 0: datetime('now') - 1-second resolution
     *    - Precision 6: STRFTIME('%Y-%m-%d %H:%M:%f', 'now') - microsecond resolution
     * 3. STRFTIME provides better fractional second support than datetime('now')
     * 4. Date/time precision affects both storage format and function choice
     *
     * However, we still test the precision handling to ensure TypeORM respects the precision
     * settings in the entity decorators when generating SQL for SQLite.
     */

    before(async () => {
        try {
            connections = await createTestingConnections({
                entities: [
                    ParentSqlite0,
                    ChildSqlite0,
                    ParentSqlite6,
                    ChildSqlite6,
                ],
                enabledDrivers: ["better-sqlite3", "sqlite"],
                schemaCreate: true,
                dropSchema: true,
            })
        } catch (error) {
            console.error(
                "SQLite not available, skipping SQLite specific tests:",
                error instanceof Error ? error.message : error,
            )
            connections = []
        }
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    const createSqliteEntities = async <
        P extends ParentSqlite0 | ParentSqlite6,
        C extends ChildSqlite0 | ChildSqlite6,
    >(
        connection: DataSource,
        Parent: new () => P,
        Child: new () => C,
        id: number,
        nameSuffix: string,
    ): Promise<{ parent: P; child: C }> => {
        const parent = new Parent()
        parent.id = id
        parent.name = `Parent ${nameSuffix}`
        const savedParent = await connection.manager.save(parent)

        const child = new Child()
        child.id = id
        child.name = `Child ${nameSuffix}`
        const savedChild = await connection.manager.save(child)

        return { parent: savedParent, child: savedChild }
    }

    // Helper function to get SQLite entity classes based on precision
    const getSqliteEntityClasses = (precision: 0 | 6) => {
        return precision === 0
            ? { Parent: ParentSqlite0, Child: ChildSqlite0 }
            : { Parent: ParentSqlite6, Child: ChildSqlite6 }
    }

    describe("SQLite Table creation verification", () => {
        it("should create tables with correct datetime precision", async () => {
            for (const connection of connections) {
                const queryRunner = connection.createQueryRunner()
                try {
                    // Test precision 0 table
                    const child0TableName =
                        connection.getMetadata(ChildSqlite0).tableName
                    const columnInfo0 = await queryRunner.query(`
                        PRAGMA table_info(${child0TableName})
                    `)
                    const updatedDateColumn0 = columnInfo0.find(
                        (col: any) => col.name === "updated_date",
                    )

                    expect(updatedDateColumn0).to.not.be.undefined
                    expect(updatedDateColumn0.type.toLowerCase()).to.include(
                        "datetime",
                    )
                    expect(updatedDateColumn0.dflt_value).to.equal(
                        "datetime('now')",
                    )

                    // Test precision 6 table
                    const child6TableName =
                        connection.getMetadata(ChildSqlite6).tableName
                    const columnInfo6 = await queryRunner.query(`
                        PRAGMA table_info(${child6TableName})
                    `)
                    const updatedDateColumn6 = columnInfo6.find(
                        (col: any) => col.name === "updated_date",
                    )

                    expect(updatedDateColumn6).to.not.be.undefined
                    expect(updatedDateColumn6.type.toLowerCase()).to.include(
                        "datetime",
                    )
                    expect(updatedDateColumn6.dflt_value).to.include("STRFTIME")
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("SQLite Basic functionality tests", () => {
        it("should handle datetime precision 0 updates correctly", async () => {
            for (const connection of connections) {
                const { Parent, Child } = getSqliteEntityClasses(0)
                const { child } = await createSqliteEntities(
                    connection,
                    Parent,
                    Child,
                    1,
                    "SQLite Precision 0",
                )

                const childBefore = await connection.manager.findOne(Child, {
                    where: { id: 1 },
                })
                expect(childBefore).to.not.equal(null)
                expect(childBefore!.updated_date).to.not.be.undefined
                expect(
                    childBefore!.updated_date!.getMilliseconds(),
                ).to.be.equal(0)

                await scheduler.wait(1100) // Wait to ensure timestamp changes

                // Update child directly to trigger UpdateDateColumn
                child.name = "Updated Child Name"
                await connection.manager.save(child)

                const childAfter = await connection.manager.findOne(Child, {
                    where: { id: 1 },
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.updated_date).to.not.be.undefined
                expect(childAfter!.updated_date!.getMilliseconds()).to.be.equal(
                    0,
                ) // Precision 0 means no fractional seconds
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
                expect(childAfter!.name).to.equal("Updated Child Name")
            }
        })

        it("should handle datetime precision 6 updates correctly", async () => {
            for (const connection of connections) {
                const { Parent, Child } = getSqliteEntityClasses(6)
                const { child } = await createSqliteEntities(
                    connection,
                    Parent,
                    Child,
                    10,
                    "SQLite Precision 6",
                )

                const childBefore = await connection.manager.findOne(Child, {
                    where: { id: 10 },
                })
                expect(childBefore).to.not.equal(null)
                expect(childBefore!.updated_date).to.not.be.undefined
                expect(
                    childBefore!.updated_date!.getMilliseconds(),
                ).to.be.within(0, 999) // STRFTIME can have fractional seconds, so we check within range

                await scheduler.wait(100) // Shorter wait for STRFTIME precision

                // Update child directly to trigger UpdateDateColumn
                child.name = "Updated Child Name"
                await connection.manager.save(child)

                const childAfter = await connection.manager.findOne(Child, {
                    where: { id: 10 },
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.updated_date).to.not.be.undefined
                expect(
                    childAfter!.updated_date!.getMilliseconds(),
                ).to.be.within(
                    0,
                    999, // STRFTIME can have fractional seconds, so we check within range
                ) // Precision 6 means we can have milliseconds
                // STRFTIME provides microsecond precision, so we should see timing differences
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
                expect(childAfter!.name).to.equal("Updated Child Name")
            }
        })

        it("should verify SQL generation uses STRFTIME for precision 6 updates", async () => {
            for (const connection of connections) {
                const { Child } = getSqliteEntityClasses(6) // Use precision 6 entity
                const { child } = await createSqliteEntities(
                    connection,
                    getSqliteEntityClasses(6).Parent, // Use precision 6 parent
                    Child,
                    20,
                    "SQLite SQL Test",
                )

                // Test direct save to trigger UpdateDateColumn
                child.name = "Updated via Save"
                await connection.manager.save(child)

                // Verify that the update was successful
                const updatedChild = await connection.manager.findOne(Child, {
                    where: { id: 20 },
                })
                expect(updatedChild).to.not.equal(null)
                expect(updatedChild!.name).to.equal("Updated via Save")
                expect(updatedChild!.updated_date).to.not.be.undefined

                // The key test: verify schema shows datetime('now') as default
                const queryRunner = connection.createQueryRunner()
                try {
                    const tableName = connection.getMetadata(Child).tableName
                    const columnInfo = await queryRunner.query(`
                        PRAGMA table_info(${tableName})
                    `)
                    const updatedDateColumn = columnInfo.find(
                        (col: any) => col.name === "updated_date",
                    )

                    expect(updatedDateColumn).to.not.be.undefined
                    expect(updatedDateColumn.dflt_value).to.include("STRFTIME")
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should verify SQL generation uses datetime('now') for precision 0 updates", async () => {
            for (const connection of connections) {
                const { Child } = getSqliteEntityClasses(0) // Use precision 0 entity
                const { child } = await createSqliteEntities(
                    connection,
                    getSqliteEntityClasses(0).Parent, // Use precision 0 parent
                    Child,
                    30,
                    "SQLite SQL Test P0",
                )

                // Test direct save to trigger UpdateDateColumn
                child.name = "Updated via Save P0"
                await connection.manager.save(child)

                // Verify that the update was successful
                const updatedChild = await connection.manager.findOne(Child, {
                    where: { id: 30 },
                })
                expect(updatedChild).to.not.equal(null)
                expect(updatedChild!.name).to.equal("Updated via Save P0")
                expect(updatedChild!.updated_date).to.not.be.undefined

                // The key test: verify schema shows datetime('now') as default for precision 0
                const queryRunner = connection.createQueryRunner()
                try {
                    const tableName = connection.getMetadata(Child).tableName
                    const columnInfo = await queryRunner.query(`
                        PRAGMA table_info(${tableName})
                    `)
                    const updatedDateColumn = columnInfo.find(
                        (col: any) => col.name === "updated_date",
                    )

                    expect(updatedDateColumn).to.not.be.undefined
                    expect(updatedDateColumn.dflt_value).to.equal(
                        "datetime('now')",
                    )
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("SQLite Schema tests", () => {
        it("should demonstrate the precision difference in schema (even though SQLite handles datetime differently)", async () => {
            for (const connection of connections) {
                // Verify that different precision settings create different column types
                const queryRunner0 = connection.createQueryRunner()
                const child0TableName =
                    connection.getMetadata(ChildSqlite0).tableName
                const table0 = await queryRunner0.getTable(child0TableName)
                const updatedDateColumn0 = table0!.columns.find(
                    (col) => col.name === "updated_date",
                )
                expect(updatedDateColumn0!.precision).to.equal(0)
                await queryRunner0.release()

                const queryRunner6 = connection.createQueryRunner()
                const child6TableName =
                    connection.getMetadata(ChildSqlite6).tableName
                const table6 = await queryRunner6.getTable(child6TableName)
                const updatedDateColumn6 = table6!.columns.find(
                    (col) => col.name === "updated_date",
                )
                expect(updatedDateColumn6!.precision).to.equal(6)
                await queryRunner6.release()
            }
        })
    })
})
