import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { FooEntity } from "./entity/Foo"
import { expect } from "chai"

// if bug persists, will throw error when creating testing connection, won't get to the test

describe("github issues > #9600 if set closure-table primary key unsigned, it occurs FK error", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [FooEntity],
                schemaCreate: true,
                enabledDrivers: ["mysql"],
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create closure columns unsigned", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const fooMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo",
                )!

                expect(fooMetadata).to.exist

                const fooClosureMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo_closure",
                )!

                expect(fooClosureMetadata).to.exist

                const ancestorCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "ancestor_id",
                )!

                expect(ancestorCol).to.exist

                const descendantCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "descendant_id",
                )!

                expect(descendantCol).to.exist

                expect(ancestorCol.unsigned).to.be.true
                expect(descendantCol.unsigned).to.be.true
            }),
        ))

    // you can add additional tests if needed
})
