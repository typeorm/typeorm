import { expect } from "chai"
import "reflect-metadata"

import { type DataSource, TableIndex } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { CircleReport } from "./entity/CircleReport"
import { Report } from "./entity/Report"

describe("github issues > #12671", () => {
    let dataSources: DataSource[]

    before(async () => {
        const oldDataSources = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Category, Report],
            schemaCreate: true,
            dropSchema: true,
        })

        await Promise.all(
            oldDataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("reports")
                const foreignKey = table!.foreignKeys.find(
                    (candidate) =>
                        candidate.columnNames.length === 1 &&
                        candidate.columnNames[0] === "categoryId",
                )!

                await queryRunner.dropForeignKey(table!, foreignKey)
                await queryRunner.query(
                    `DROP INDEX \`${foreignKey.name}\` ON \`reports\``,
                )
                await queryRunner.createIndex(
                    table!,
                    new TableIndex({
                        name: foreignKey.name,
                        columnNames: foreignKey.columnNames,
                    }),
                )
                await queryRunner.createForeignKey(table!, foreignKey)
                await queryRunner.release()
            }),
        )
        await closeTestingConnections(oldDataSources)

        dataSources = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Category, CircleReport],
        })
    })

    after(() => closeTestingConnections(dataSources))

    // Regression test for https://github.com/typeorm/typeorm/issues/12671
    it("keeps generated foreign key indexes aligned after a table rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const oldTable = await queryRunner.getTable("reports")
                expect(oldTable).to.exist

                const oldForeignKeyNames = oldTable!.foreignKeys.map(
                    (foreignKey) => foreignKey.name,
                )
                const oldImplicitForeignKey = oldTable!.foreignKeys.find(
                    (foreignKey) =>
                        foreignKey.columnNames.length === 1 &&
                        foreignKey.columnNames[0] === "categoryId",
                )!
                expect(oldForeignKeyNames).to.have.length(2)
                expect(oldTable!.indices.map((index) => index.name)).to.include(
                    "IDX_12671_custom_covering",
                )

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable(oldTable!, "circle_reports")

                const reloadQueryRunner = dataSource.createQueryRunner()
                const renamedTable =
                    await reloadQueryRunner.getTable("circle_reports")
                expect(renamedTable).to.exist

                const metadata = dataSource.getMetadata(CircleReport)
                const newForeignKeyNames = metadata.foreignKeys.map(
                    (foreignKey) => foreignKey.name,
                )
                expect(
                    renamedTable!.foreignKeys.map(
                        (foreignKey) => foreignKey.name,
                    ),
                ).to.have.members(newForeignKeyNames)

                const implicitForeignKey = metadata.foreignKeys.find(
                    (foreignKey) =>
                        foreignKey.columnNames.length === 1 &&
                        foreignKey.columnNames[0] === "categoryId",
                )!
                const coveringIndexForeignKey = metadata.foreignKeys.find(
                    (foreignKey) =>
                        foreignKey.columnNames.length === 1 &&
                        foreignKey.columnNames[0] === "indexedCategoryId",
                )!
                const databaseIndices: { Key_name: string }[] =
                    await reloadQueryRunner.query(
                        "SHOW INDEX FROM `circle_reports`",
                    )
                const databaseIndexNames = databaseIndices.map(
                    (index) => index.Key_name,
                )
                expect(databaseIndexNames).to.include(
                    "IDX_12671_custom_covering",
                )
                expect(databaseIndexNames).not.to.include(
                    coveringIndexForeignKey.name,
                )

                await reloadQueryRunner.query(
                    "INSERT INTO `issue_12671_categories` (`id`) VALUES (1)",
                )
                await reloadQueryRunner.query(
                    "INSERT INTO `circle_reports` (`categoryId`, `indexedCategoryId`, `note`) VALUES (1, 1, 'valid')",
                )

                const schemaLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(
                    schemaLog.upQueries.some((query) =>
                        query.query.includes("DROP INDEX"),
                    ),
                ).to.be.false
                expect(schemaLog.upQueries).to.be.empty
                expect(databaseIndexNames).to.include(implicitForeignKey.name)

                await queryRunner.executeMemoryDownSql()

                const downQueryRunner = dataSource.createQueryRunner()
                expect(await downQueryRunner.hasTable("circle_reports")).to.be
                    .false
                const revertedTable = await downQueryRunner.getTable("reports")
                expect(revertedTable).to.exist
                expect(
                    revertedTable!.foreignKeys.map(
                        (foreignKey) => foreignKey.name,
                    ),
                ).to.have.members(oldForeignKeyNames)
                expect(
                    revertedTable!.indices.map((index) => index.name),
                ).to.include("IDX_12671_custom_covering")
                const revertedDatabaseIndices: { Key_name: string }[] =
                    await downQueryRunner.query("SHOW INDEX FROM `reports`")
                const revertedDatabaseIndexNames = revertedDatabaseIndices.map(
                    (index) => index.Key_name,
                )
                expect(revertedDatabaseIndexNames).to.include(
                    oldImplicitForeignKey.name,
                )
                expect(revertedDatabaseIndexNames).not.to.include(
                    implicitForeignKey.name,
                )

                await downQueryRunner.release()
                await reloadQueryRunner.release()
                await queryRunner.release()
            }),
        ))
})
