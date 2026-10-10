import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Customer } from "./entity/Customer"

describe("schema-builder > constraint > unique > one-to-one join column name", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mssql",
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

    it("should give the @OneToOne unique constraint the same name when the join column is added to an existing table", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Customer)
                const expectedName = metadata.uniques.find(
                    (unique) =>
                        unique.columns.length === 1 &&
                        unique.columns[0].databaseName === "profileId",
                )!.name

                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("customer")
                const findUnique = () =>
                    table!.uniques.find(
                        (unique) =>
                            unique.columnNames.length === 1 &&
                            unique.columnNames[0] === "profileId",
                    )
                expect(findUnique()?.name).to.equal(expectedName)

                // drop the join column, then let synchronize add it back
                // to the existing table
                const foreignKey = table!.foreignKeys.find((fk) =>
                    fk.columnNames.includes("profileId"),
                )!
                await queryRunner.dropForeignKey(table!, foreignKey)
                await queryRunner.dropColumn(table!, "profileId")

                await dataSource.synchronize()

                table = await queryRunner.getTable("customer")
                expect(findUnique()?.name).to.equal(expectedName)

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
            }),
        ))
})
