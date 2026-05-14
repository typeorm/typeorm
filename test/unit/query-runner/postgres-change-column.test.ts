import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("query runner > postgres > change column", () => {
    function createQueryRunner() {
        const dataSource = new DataSource({
            type: "postgres",
            database: "typeorm_test",
            schema: "public",
            driver: {},
        } as PostgresDataSourceOptions)
        const driver = dataSource.driver as PostgresDriver

        driver.searchSchema = "public"
        driver.spatialTypes = []

        const queryRunner = new PostgresQueryRunner(driver, "master")
        queryRunner.enableSqlMemory()

        return queryRunner
    }

    it("changes varchar length without dropping the column and updates the cached table", async () => {
        const queryRunner = createQueryRunner()
        const table = new Table({
            name: "users",
            columns: [
                {
                    name: "name",
                    type: "character varying",
                    length: "50",
                },
            ],
        })
        const newColumn = new TableColumn({
            name: "name",
            type: "character varying",
            length: "51",
        })

        queryRunner.loadedTables = [table]

        await queryRunner.changeColumn(table, table.columns[0], newColumn)

        const upQueries = queryRunner
            .getMemorySql()
            .upQueries.map((query) => query.query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "users" ALTER COLUMN "name" TYPE character varying(51)',
        ])
        expect(upQueries.join("\n")).not.to.contain("DROP COLUMN")
        expect(upQueries.join("\n")).not.to.contain(" ADD ")
        expect(queryRunner.loadedTables[0].columns[0].length).to.equal("51")
    })

    it("uses the new varchar length when changing length and collation together", async () => {
        const queryRunner = createQueryRunner()
        const table = new Table({
            name: "users",
            columns: [
                {
                    name: "name",
                    type: "character varying",
                    length: "50",
                    collation: "en_US",
                },
            ],
        })
        const newColumn = new TableColumn({
            name: "name",
            type: "character varying",
            length: "51",
            collation: "sv_SE",
        })

        queryRunner.loadedTables = [table]

        await queryRunner.changeColumn(table, table.columns[0], newColumn)

        const upQueries = queryRunner
            .getMemorySql()
            .upQueries.map((query) => query.query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "users" ALTER COLUMN "name" TYPE character varying(51) COLLATE "sv_SE"',
        ])
        expect(queryRunner.loadedTables[0].columns[0].length).to.equal("51")
        expect(queryRunner.loadedTables[0].columns[0].collation).to.equal(
            "sv_SE",
        )
    })
})
