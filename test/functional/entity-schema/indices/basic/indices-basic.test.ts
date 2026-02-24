import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import type { EntityMetadata } from "../../../../../src/metadata/EntityMetadata"
import { IndexMetadata } from "../../../../../src/metadata/IndexMetadata"
import { expect } from "chai"
import { PersonSchema } from "./entity/Person"

describe("entity-schema > indices > basic", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [<any>PersonSchema],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create a non unique index with 2 columns", () =>
        Promise.all(
            dataSources.map(async (connection) => {
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

    it("should update the index to be unique", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const entityMetadata = connection.entityMetadatas.find(
                    (x) => x.name === "Person",
                )
                const indexMetadata = entityMetadata!.indices.find(
                    (x) => x.name === "IDX_TEST",
                )
                indexMetadata!.isUnique = true

                await connection.synchronize(false)

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                // CockroachDB stores unique indices as UNIQUE constraints
                if (connection.driver.options.type === "cockroachdb") {
                    expect(table!.uniques.length).to.be.equal(1)
                    expect(table!.uniques[0].name).to.be.equal("IDX_TEST")
                    expect(table!.uniques[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.uniques[0].columnNames,
                    ).to.deep.include.members(["FirstName", "LastName"])
                } else {
                    expect(table!.indices.length).to.be.equal(1)
                    expect(table!.indices[0].name).to.be.equal("IDX_TEST")
                    expect(table!.indices[0].isUnique).to.be.true
                    expect(table!.indices[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.indices[0].columnNames,
                    ).to.deep.include.members(["FirstName", "LastName"])
                }
            }),
        ))

    it("should update the index swaping the 2 columns", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const entityMetadata = connection.entityMetadatas.find(
                    (x) => x.name === "Person",
                )
                entityMetadata!.indices = [
                    new IndexMetadata({
                        entityMetadata: <EntityMetadata>entityMetadata,
                        args: {
                            target: entityMetadata!.target,
                            name: "IDX_TEST",
                            columns: ["LastName", "FirstName"],
                            unique: false,
                            synchronize: true,
                        },
                    }),
                ]
                entityMetadata!.indices.forEach((index) =>
                    index.build(connection.namingStrategy),
                )

                await connection.synchronize(false)

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
})
