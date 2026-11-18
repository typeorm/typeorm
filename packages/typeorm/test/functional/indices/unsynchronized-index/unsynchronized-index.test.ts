import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { TableIndex } from "../../../../src/schema-builder/table/TableIndex"
import { SampleEntity } from "./entity/SampleEntity"
import { expect } from "chai"

// Functional test suite for unsynchronized indices (regression coverage for #10348)
describe("indices > unsynchronized index", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [SampleEntity],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should build proper index names for unsynchronized indices without given name", () => {
        dataSources.map((dataSource) => {
            const metadata = dataSource.getMetadata(SampleEntity)
            expect(metadata.indices.length).to.be.equal(2)

            for (const index of metadata.indices) {
                expect(index.name).to.be.a("string")
                expect(index.name.length).to.be.greaterThan(0)
                expect(index.synchronize).to.be.false
            }
        })
    })

    it("should not drop existing unsynchronized indices during schema sync", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("sample_entity")
                expect(table).not.to.be.undefined

                const metadata = dataSource.getMetadata(SampleEntity)
                const titleIndexName = metadata.indices.find((i) =>
                    i.columns.some((c) => c.propertyName === "title"),
                )!.name

                await queryRunner.createIndex(
                    table!,
                    new TableIndex({
                        name: titleIndexName,
                        columnNames: ["title"],
                    }),
                )
                await queryRunner.createIndex(
                    table!,
                    new TableIndex({
                        name: "custom_unsynced_idx",
                        columnNames: ["tag"],
                    }),
                )

                table = await queryRunner.getTable("sample_entity")
                expect(table!.indices.length).to.be.equal(2)

                await dataSource.synchronize()

                table = await queryRunner.getTable("sample_entity")
                expect(table!.indices.length).to.be.equal(2)
                expect(table!.indices.find((i) => i.name === titleIndexName))
                    .not.to.be.undefined
                expect(
                    table!.indices.find(
                        (i) => i.name === "custom_unsynced_idx",
                    ),
                ).not.to.be.undefined

                await queryRunner.release()
            }),
        ))
})
