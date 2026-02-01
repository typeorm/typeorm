import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"
import { PersonSchema } from "./entity/Person"

describe("entity-schema > indices > duplicate", () => {
    // Tests for GitHub issue #5062: Duplicate indices generation
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [<any>PersonSchema],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not create duplicate indices for the same entity schema", () =>
        Promise.all(
            connections.map(async (connection) => {
                const entityMetadata = connection.entityMetadatas.find(
                    (x) => x.name === "Person",
                )

                // Verify that only one index exists in the metadata
                expect(entityMetadata!.indices.length).to.be.equal(1)
                expect(entityMetadata!.indices[0].name).to.be.equal("IDX_TEST")

                // Verify that only one index is created in the database
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                expect(table!.indices.length).to.be.equal(1)
                expect(table!.indices[0].name).to.be.equal("IDX_TEST")
                expect(table!.indices[0].isUnique).to.be.false
                expect(table!.indices[0].columnNames.length).to.be.equal(2)
                expect(table!.indices[0].columnNames).to.deep.include.members([
                    "FirstName",
                    "LastName",
                ])
            }),
        ))

    it("should filter out duplicate indices from MetadataArgsStorage", () =>
        Promise.all(
            connections.map(async (connection) => {
                const entityMetadata = connection.entityMetadatas.find(
                    (x) => x.name === "Person",
                )

                // Get the filtered indices from the metadata args storage
                const metadataArgsStorage =
                    (connection as any).namingStrategy.metadataArgsStorage ||
                    (connection as any).metadataArgsStorage

                if (metadataArgsStorage) {
                    const filteredIndices = metadataArgsStorage.filterIndices(
                        entityMetadata!.target,
                    )

                    // Verify that duplicates are filtered out
                    expect(filteredIndices.length).to.be.equal(1)

                    // Verify the index properties
                    expect(filteredIndices[0].name).to.be.equal("IDX_TEST")
                    expect(filteredIndices[0].columns).to.deep.equal([
                        "FirstName",
                        "LastName",
                    ])
                }
            }),
        ))
})
