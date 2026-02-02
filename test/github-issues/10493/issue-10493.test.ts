import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #10493 Broken migrations for indices on TIMESTAMP WITH TIMEZONE Oracle Database columns", () => {
    let dataSources: DataSource[]

    beforeAll(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User],
                enabledDrivers: ["oracle"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should ignore virtual columns when indexing Oracle TIMESTAMP WITH TIME ZONE columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Prior to this fix, TypeORM would attempt to drop the virtual
                // column and recreate the index.
                //
                // Usually, this would fail because it should not have any info
                // about the virtual column on the "typeorm_metadata" table.
                //
                // But even after creating the metadata table manually, it
                // would still fail because Oracle does not allow dropping
                // virtual columns that were automatically generated.
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.have.length(0)
                expect(sqlInMemory.downQueries).to.have.length(0)
            }),
        ))
})
