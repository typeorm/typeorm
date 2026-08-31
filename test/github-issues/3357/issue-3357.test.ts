import "reflect-metadata"
import { expect } from "chai"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import { MysqlQueryRunner } from "../../../src/driver/mysql/MysqlQueryRunner"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import { SqlServerQueryRunner } from "../../../src/driver/sqlserver/SqlServerQueryRunner"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { CockroachQueryRunner } from "../../../src/driver/cockroachdb/CockroachQueryRunner"
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver"
import { OracleQueryRunner } from "../../../src/driver/oracle/OracleQueryRunner"
import { SapDriver } from "../../../src/driver/sap/SapDriver"
import { SapQueryRunner } from "../../../src/driver/sap/SapQueryRunner"
import { SpannerDriver } from "../../../src/driver/spanner/SpannerDriver"
import { SpannerQueryRunner } from "../../../src/driver/spanner/SpannerQueryRunner"
import { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering resulting in data loss", () => {
    it("PostgresQueryRunner should generate ALTER COLUMN TYPE instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "postgres",
            database: "test",
        })
        const driver = new PostgresDriver(dataSource)
        const queryRunner = new PostgresQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasAlterTypeQuery = executedQueries.some(
            (q) =>
                q.toUpperCase().includes("ALTER COLUMN") &&
                q.toUpperCase().includes("TYPE") &&
                q.includes("51"),
        )
        expect(hasAlterTypeQuery).to.be.true
    })

    it("MysqlQueryRunner should generate ALTER TABLE CHANGE instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "mysql",
            database: "test",
        })
        const driver = new MysqlDriver(dataSource)
        const queryRunner = new MysqlQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasChangeQuery = executedQueries.some(
            (q) => q.toUpperCase().includes("CHANGE") && q.includes("51"),
        )
        expect(hasChangeQuery).to.be.true
    })

    it("SqlServerQueryRunner should generate ALTER COLUMN instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "mssql",
            database: "test",
        })
        const driver = new SqlServerDriver(dataSource)
        const queryRunner = new SqlServerQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasAlterQuery = executedQueries.some(
            (q) => q.toUpperCase().includes("ALTER COLUMN") && q.includes("51"),
        )
        expect(hasAlterQuery).to.be.true
    })

    it("CockroachQueryRunner should generate ALTER COLUMN TYPE instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "cockroachdb",
            database: "test",
            timeTravelQueries: false,
        })
        const driver = new CockroachDriver(dataSource)
        const queryRunner = new CockroachQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasAlterTypeQuery = executedQueries.some(
            (q) =>
                q.toUpperCase().includes("ALTER COLUMN") &&
                q.toUpperCase().includes("TYPE") &&
                q.includes("51"),
        )
        expect(hasAlterTypeQuery).to.be.true
    })

    it("OracleQueryRunner should generate MODIFY instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "oracle",
            database: "test",
        })
        const driver = new OracleDriver(dataSource)
        const queryRunner = new OracleQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar2",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasModifyQuery = executedQueries.some(
            (q) => q.toUpperCase().includes("MODIFY") && q.includes("51"),
        )
        expect(hasModifyQuery).to.be.true
    })

    it("SapQueryRunner should generate ALTER instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "sap",
            database: "test",
        })
        const driver = new SapDriver(dataSource)
        const queryRunner = new SapQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "varchar",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasAlterQuery = executedQueries.some(
            (q) => q.toUpperCase().includes("ALTER") && q.includes("51"),
        )
        expect(hasAlterQuery).to.be.true
    })

    it("SpannerQueryRunner should generate ALTER COLUMN TYPE instead of DROP/ADD when changing column length or type", async () => {
        const dataSource = new DataSource({
            type: "spanner",
            projectId: "test",
            instanceId: "test",
            databaseId: "test",
        })
        const driver = new SpannerDriver(dataSource)
        const queryRunner = new SpannerQueryRunner(driver, "master")

        const table = new Table({
            name: "bug",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int64",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "example",
                    type: "string",
                    length: "50",
                }),
            ],
        })

        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        const executedQueries: string[] = []
        ;(queryRunner as any).executeQueries = async (
            upQueries: any,
            downQueries: any,
        ) => {
            const upList = Array.isArray(upQueries) ? upQueries : [upQueries]
            executedQueries.push(...upList.map((q: any) => q.query || q))
        }

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const hasDropQuery = executedQueries.some((q) =>
            q.toUpperCase().includes("DROP COLUMN"),
        )
        expect(hasDropQuery).to.be.false

        const hasAlterTypeQuery = executedQueries.some(
            (q) =>
                q.toUpperCase().includes("ALTER COLUMN") &&
                q.toUpperCase().includes("TYPE") &&
                q.includes("51"),
        )
        expect(hasAlterTypeQuery).to.be.true
    })
})
