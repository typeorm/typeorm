import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src/data-source/DataSource"
import type { EntityTarget } from "../../../../../../src/common/EntityTarget"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Account } from "./entity/Account"
import { Customer } from "./entity/Customer"

// Drivers that store the owning @OneToOne uniqueness as a unique constraint.
// MySQL, Aurora MySQL, SQL Server, SAP and Spanner use a unique index instead.
describe("schema-builder > constraint > unique > one-to-one join column name", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "oracle",
                "postgres",
            ],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Re-adds the join column to the existing table through synchronize and
    // checks that its unique constraints get the names CREATE TABLE gave them.
    const expectSameUniquesAfterReAdd = async (
        dataSource: DataSource,
        target: EntityTarget<any>,
    ) => {
        const metadata = dataSource.getMetadata(target)

        await using queryRunner = dataSource.createQueryRunner()
        const uniqueNames = async () =>
            (await queryRunner.getTable(metadata.tableName))!.uniques
                .filter(
                    (unique) =>
                        unique.columnNames.length === 1 &&
                        unique.columnNames[0] === "profileId",
                )
                .map((unique) => unique.name)
                .sort()

        // names as created by CREATE TABLE
        const createdNames = await uniqueNames()
        expect(createdNames).to.not.be.empty

        const table = (await queryRunner.getTable(metadata.tableName))!
        const foreignKey = table.foreignKeys.find((fk) =>
            fk.columnNames.includes("profileId"),
        )!
        await queryRunner.dropForeignKey(table, foreignKey)
        await queryRunner.dropColumn(table, "profileId")

        await dataSource.synchronize()

        expect(await uniqueNames()).to.eql(createdNames)

        const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
        expect(sqlInMemory.upQueries).to.eql([])
    }

    // see https://github.com/typeorm/typeorm/issues/12952
    it("should give the @OneToOne unique constraint the same name when the join column is added to an existing table", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await expectSameUniquesAfterReAdd(dataSource, Customer)

                await using queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("customer")
                const relationUnique = dataSource
                    .getMetadata(Customer)
                    .uniques.find(
                        (unique) =>
                            unique.columns[0].databaseName === "profileId",
                    )!
                expect(table!.uniques.map((unique) => unique.name)).to.include(
                    relationUnique.name,
                )
            }),
        ))

    // Postgres keeps only the first of several identical UNIQUE constraints
    // in CREATE TABLE, so re-adding the column must not create the others.
    // SQLite and CockroachDB handle duplicates differently, see #12952.
    it("should keep only the first unique when the join column also has an unnamed @Unique", () =>
        Promise.all(
            dataSources
                .filter((dataSource) => dataSource.options.type === "postgres")
                .map((dataSource) =>
                    expectSameUniquesAfterReAdd(dataSource, Account),
                ),
        ))
})
