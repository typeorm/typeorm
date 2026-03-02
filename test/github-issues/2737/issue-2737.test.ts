import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #2737 MySQLDriver findChangedColumns (fields: width, precision)", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                dropSchema: false,
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql", "mariadb", "aurora-mysql"],
                schemaCreate: false,
                cache: false,
                driverSpecific: {
                    bigNumberStrings: false,
                },
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should not create migrations for an existing unique index when bigNumberStrings is false", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const entityMetadata = connection.entityMetadatas.find(
                    (x) => x.name === "TestEntity",
                )
                const indexMetadata = entityMetadata!.indices.find((index) =>
                    index.columns.some(
                        (column) => column.propertyName === "unique_column",
                    ),
                )

                // Ensure the setup is correct
                expect(indexMetadata).to.exist
                expect(indexMetadata!.isUnique).to.be.true

                await connection.synchronize(false)

                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()

                expect(syncQueries.downQueries).to.be.an("array").that.is.empty
                expect(syncQueries.upQueries).to.be.an("array").that.is.empty
            }),
        ))
})
