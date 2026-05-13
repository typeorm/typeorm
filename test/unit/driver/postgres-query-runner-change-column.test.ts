import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { DefaultNamingStrategy } from "../../../src/naming-strategy/DefaultNamingStrategy"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("driver > postgres > change column", () => {
    function createPostgresQueryRunner(): PostgresQueryRunner {
        const driver = Object.create(PostgresDriver.prototype) as PostgresDriver

        driver.dataSource = {
            driver,
            namingStrategy: new DefaultNamingStrategy(),
        } as unknown as DataSource
        driver.database = undefined
        driver.schema = undefined
        driver.searchSchema = undefined
        driver.spatialTypes = []

        const queryRunner = new PostgresQueryRunner(driver, "master")
        queryRunner.enableSqlMemory()

        return queryRunner
    }

    it("should alter varchar length without dropping the column", async () => {
        const queryRunner = createPostgresQueryRunner()
        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
        })
        const table = new Table({
            name: "bug",
            columns: [oldColumn],
        })
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const sqlInMemory = queryRunner.getMemorySql()
        const upQueries = sqlInMemory.upQueries.map(({ query }) => query)
        const downQueries = sqlInMemory.downQueries.map(({ query }) => query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
        ])
        expect(downQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)',
        ])
        expect(upQueries.join(" ")).not.to.include("DROP COLUMN")
        expect(upQueries.join(" ")).not.to.include("ADD")
    })
})
