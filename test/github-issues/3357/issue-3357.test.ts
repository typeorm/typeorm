import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { TableColumn } from "../../../src"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #3357 column change should use ALTER instead of DROP+ADD to prevent data loss", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "postgres",
                "mysql",
                "mariadb",
                "cockroachdb",
                "oracle",
            ],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should use ALTER COLUMN for length change instead of DROP + ADD", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                // Insert test data
                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "INSERT INTO `bug` (`example`, `description`) VALUES ('test_data', 'some description')"
                        : `INSERT INTO "bug" ("example", "description") VALUES ('test_data', 'some description')`,
                )

                // Change column length from 50 to 51
                let table = await queryRunner.getTable("bug")
                const exampleColumn = table!.findColumnByName("example")!
                const changedColumn = exampleColumn.clone()
                changedColumn.length = "51"

                await queryRunner.changeColumn(
                    table!,
                    exampleColumn,
                    changedColumn,
                )

                // Verify the column was altered (not dropped)
                table = await queryRunner.getTable("bug")

                if (!DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    expect(
                        table!.findColumnByName("example")!.length,
                    ).to.equal("51")
                }

                // Verify data was preserved (this is the key assertion)
                const rows = await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "SELECT `example` FROM `bug`"
                        : `SELECT "example" FROM "bug"`,
                )
                expect(rows).to.have.length(1)
                expect(rows[0].example).to.equal("test_data")

                await queryRunner.release()
            }),
        ))

    it("should use ALTER COLUMN for type change and preserve data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                // Insert test data
                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "INSERT INTO `bug` (`example`, `description`) VALUES ('type_test', 'desc')"
                        : `INSERT INTO "bug" ("example", "description") VALUES ('type_test', 'desc')`,
                )

                // Change column type from varchar to text
                let table = await queryRunner.getTable("bug")
                const descColumn = table!.findColumnByName("description")!
                const changedColumn = descColumn.clone()
                changedColumn.type = "text"
                changedColumn.length = ""

                await queryRunner.changeColumn(
                    table!,
                    descColumn,
                    changedColumn,
                )

                // Verify the column type was changed
                table = await queryRunner.getTable("bug")
                const updatedCol = table!.findColumnByName("description")!
                expect(updatedCol.type).to.equal("text")

                // Verify data was preserved
                const rows = await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "SELECT `description` FROM `bug`"
                        : `SELECT "description" FROM "bug"`,
                )
                expect(rows.length).to.be.greaterThan(0)
                // At least one row should have our test data
                const hasData = rows.some(
                    (r: any) => r.description === "desc",
                )
                expect(hasData).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should generate ALTER COLUMN SQL in migration, not DROP + ADD", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("bug")
                const exampleColumn = table!.findColumnByName("example")!
                const changedColumn = exampleColumn.clone()
                changedColumn.length = "200"

                // Use queryRunner's stored queries approach
                const oldLength = exampleColumn.length
                await queryRunner.changeColumn(
                    table!,
                    exampleColumn,
                    changedColumn,
                )

                // Check logged queries - none should be DROP COLUMN for this change
                const executedQueries =
                    queryRunner.getMemorySql().upQueries || []
                const hasDropColumn = executedQueries.some(
                    (q: any) =>
                        typeof q.query === "string" &&
                        q.query.includes("DROP COLUMN") &&
                        q.query.includes("example"),
                )
                expect(hasDropColumn).to.be.false

                await queryRunner.release()
            }),
        ))
})
