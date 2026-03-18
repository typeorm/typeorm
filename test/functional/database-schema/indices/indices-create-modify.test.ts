import { expect } from "chai"
import "reflect-metadata"
import type { DataSource, EntityMetadata } from "../../../../src"
import { IndexMetadata } from "../../../../src/metadata/IndexMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

import { Person } from "./entity/Person"

describe("database schema > indices > reading index from entity and updating database", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should create a non unique index with 2 columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                expect(table!.indices.length).to.be.equal(1)
                expect(table!.indices[0].name).to.be.equal("IDX_TEST")
                expect(table!.indices[0].isUnique).to.be.false
                expect(table!.indices[0].columnNames.length).to.be.equal(2)
                expect(table!.indices[0].columnNames).to.deep.include.members([
                    "firstname",
                    "lastname",
                ])
            }),
        ))

    it("should update the index to be unique", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityMetadata = dataSource.entityMetadatas.find(
                    (x) => x.name === "Person",
                )
                const indexMetadata = entityMetadata!.indices.find(
                    (x) => x.name === "IDX_TEST",
                )
                indexMetadata!.isUnique = true

                await dataSource.synchronize(false)

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                // CockroachDB stores unique indices as UNIQUE constraints
                if (dataSource.driver.options.type === "cockroachdb") {
                    expect(table!.uniques.length).to.be.equal(1)
                    expect(table!.uniques[0].name).to.be.equal("IDX_TEST")
                    expect(table!.uniques[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.uniques[0].columnNames,
                    ).to.deep.include.members(["firstname", "firstname"])
                } else {
                    expect(table!.indices.length).to.be.equal(1)
                    expect(table!.indices[0].name).to.be.equal("IDX_TEST")
                    expect(table!.indices[0].isUnique).to.be.true
                    expect(table!.indices[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.indices[0].columnNames,
                    ).to.deep.include.members(["firstname", "firstname"])
                }
            }),
        ))

    it("should update the index swapping the 2 columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityMetadata = dataSource.entityMetadatas.find(
                    (x) => x.name === "Person",
                )
                entityMetadata!.indices = [
                    new IndexMetadata({
                        entityMetadata: <EntityMetadata>entityMetadata,
                        args: {
                            target: Person,
                            name: "IDX_TEST",
                            columns: ["lastname", "firstname"],
                            unique: false,
                            synchronize: true,
                        },
                    }),
                ]
                entityMetadata!.indices.forEach((index) =>
                    index.build(dataSource.namingStrategy),
                )

                await dataSource.synchronize(false)

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                expect(table!.indices.length).to.be.equal(1)
                expect(table!.indices[0].name).to.be.equal("IDX_TEST")
                expect(table!.indices[0].isUnique).to.be.false
                expect(table!.indices[0].columnNames.length).to.be.equal(2)
                expect(table!.indices[0].columnNames).to.deep.include.members([
                    "firstname",
                    "lastname",
                ])
            }),
        ))
})
