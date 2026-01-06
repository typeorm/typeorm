import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("github issues > #10991", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [__dirname + "/migrations/*{.js,.ts}"],
            enabledDrivers: ["cockroachdb", "postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to load tables with names containing dots", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `table.with.dots`
                await queryRunner.query(
                    `CREATE TABLE "${tableName}" (id serial PRIMARY KEY)`,
                )
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(tableName)
                await queryRunner.query(`DROP TABLE "${tableName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to load tables with names containing mixed special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `My "Special" Table's Name`
                const escapedName = tableName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedName}" (id serial PRIMARY KEY)`,
                )
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(tableName)
                await queryRunner.query(`DROP TABLE "${escapedName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to clear database with tables containing special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table1 = `clear"test"table`
                const table2 = `clear.test.table`
                const escapedTable1 = table1.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedTable1}" (id serial PRIMARY KEY)`,
                )
                await queryRunner.query(
                    `CREATE TABLE "${table2}" (id serial PRIMARY KEY)`,
                )

                let tables = await queryRunner.getTables()
                let tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(table1)
                expect(tableNames).to.include(table2)

                await queryRunner.clearDatabase()

                tables = await queryRunner.getTables()
                tableNames = tables.map((table) => table.name)
                expect(tableNames).to.not.include(table1)
                expect(tableNames).to.not.include(table2)

                await queryRunner.release()
            }),
        ))

    it("should be able to get column descriptions for tables with special character names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `desc"test"table`
                const escapedName = tableName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedName}" (id serial PRIMARY KEY, name varchar(255))`,
                )
                await queryRunner.query(
                    `COMMENT ON COLUMN "${escapedName}"."name" IS 'Test column comment'`,
                )

                const tables = await queryRunner.getTables([tableName])
                expect(tables.length).to.equal(1)
                const table = tables[0]
                const nameColumn = table.columns.find((c) => c.name === "name")
                expect(nameColumn).to.not.be.undefined
                expect(nameColumn!.comment).to.equal("Test column comment")

                await queryRunner.query(`DROP TABLE "${escapedName}"`)
                await queryRunner.release()
            }),
        ))

    it("should handle hasTable with special character table names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `has"Table"Test`
                const escapedName = tableName.replace(/"/g, '""')

                let hasTable = await queryRunner.hasTable(tableName)
                expect(hasTable).to.be.false

                await queryRunner.query(
                    `CREATE TABLE "${escapedName}" (id serial PRIMARY KEY)`,
                )

                // Table should now exist
                hasTable = await queryRunner.hasTable(tableName)
                expect(hasTable).to.be.true

                await queryRunner.query(`DROP TABLE "${escapedName}"`)
                await queryRunner.release()
            }),
        ))

    it("should handle hasColumn with special character table and column names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `has"Column"Test`
                const columnName = `my"Column"`
                const escapedTableName = tableName.replace(/"/g, '""')
                const escapedColumnName = columnName.replace(/"/g, '""')

                await queryRunner.query(
                    `CREATE TABLE "${escapedTableName}" ("${escapedColumnName}" varchar(255))`,
                )
                let hasColumn = await queryRunner.hasColumn(
                    tableName,
                    columnName,
                )
                expect(hasColumn).to.be.true

                hasColumn = await queryRunner.hasColumn(
                    tableName,
                    "nonexistent",
                )
                expect(hasColumn).to.be.false

                await queryRunner.query(`DROP TABLE "${escapedTableName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to clear database with views containing special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `view"base"table`
                const escapedTableName = tableName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedTableName}" (id serial PRIMARY KEY, name varchar(255))`,
                )

                const viewName = `my"special"view`
                const escapedViewName = viewName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE VIEW "${escapedViewName}" AS SELECT * FROM "${escapedTableName}"`,
                )

                await queryRunner.clearDatabase()

                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.not.include(tableName)

                await queryRunner.release()
            }),
        ))

    it("should be able to load tables with names containing backslashes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `table\\with\\backslashes`
                await queryRunner.query(
                    `CREATE TABLE "${tableName}" (id serial PRIMARY KEY)`,
                )
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(tableName)
                await queryRunner.query(`DROP TABLE "${tableName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to load tables with names containing parentheses and brackets", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `table(with)[brackets]`
                await queryRunner.query(
                    `CREATE TABLE "${tableName}" (id serial PRIMARY KEY)`,
                )
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(tableName)
                await queryRunner.query(`DROP TABLE "${tableName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to load tables with names containing unicode characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `表格名称_テーブル_tâblé`
                await queryRunner.query(
                    `CREATE TABLE "${tableName}" (id serial PRIMARY KEY)`,
                )
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(tableName)
                await queryRunner.query(`DROP TABLE "${tableName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to get table comments for tables with special character names", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `comment"test"table`
                const escapedName = tableName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedName}" (id serial PRIMARY KEY)`,
                )
                await queryRunner.query(
                    `COMMENT ON TABLE "${escapedName}" IS 'Test table comment'`,
                )
                const tables = await queryRunner.getTables([tableName])
                expect(tables.length).to.equal(1)
                const table = tables[0]
                expect(table.comment).to.equal("Test table comment")

                await queryRunner.query(`DROP TABLE "${escapedName}"`)
                await queryRunner.release()
            }),
        ))

    it("should be able to clear database with multiple tables containing various special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tables = [
                    `multi"quote"table`,
                    `multi.dot.table`,
                    `multi\\backslash\\table`,
                ]

                for (const tableName of tables) {
                    const escapedName = tableName.replace(/"/g, '""')
                    try {
                        await queryRunner.query(
                            `CREATE TABLE "${escapedName}" (id serial PRIMARY KEY)`,
                        )
                    } catch {
                        // Some characters might not be valid in table names
                    }
                }

                let loadedTables = await queryRunner.getTables()
                const existingTables = loadedTables.filter((t) =>
                    tables.includes(t.name),
                )
                expect(existingTables.length).to.be.greaterThan(0)

                await queryRunner.clearDatabase()

                loadedTables = await queryRunner.getTables()
                const remainingTables = loadedTables.filter((t) =>
                    tables.includes(t.name),
                )
                expect(remainingTables.length).to.equal(0)

                await queryRunner.release()
            }),
        ))
})

describe("github issues > #10991 - Postgres specific", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to clear database with materialized views containing special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tableName = `matview"base"table`
                const escapedTableName = tableName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE TABLE "${escapedTableName}" (id serial PRIMARY KEY, name varchar(255))`,
                )

                const matViewName = `my"special"matview`
                const escapedMatViewName = matViewName.replace(/"/g, '""')
                await queryRunner.query(
                    `CREATE MATERIALIZED VIEW "${escapedMatViewName}" AS SELECT * FROM "${escapedTableName}"`,
                )

                await queryRunner.clearDatabase()

                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.not.include(tableName)

                await queryRunner.release()
            }),
        ))
})

describe("github issues > #10991 - CockroachDB specific", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["cockroachdb"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to clear database with sequences containing special characters", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const seqName = `my"special"sequence`
                const escapedSeqName = seqName.replace(/"/g, '""')
                await queryRunner.query(`CREATE SEQUENCE "${escapedSeqName}"`)
                await queryRunner.clearDatabase()
                await queryRunner.release()
            }),
        ))
})
