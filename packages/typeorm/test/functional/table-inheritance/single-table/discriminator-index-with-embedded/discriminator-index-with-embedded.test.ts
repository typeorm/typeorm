import "reflect-metadata"

import { expect } from "chai"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import type { EntityMetadata } from "../../../../../src/metadata/EntityMetadata"

import {
    EmbeddedBase,
    EmbeddedChild,
    IndexedBase,
    IndexedChild,
    PlainBase,
    PlainChild,
} from "./entity"

function discriminatorIndices(metadata: EntityMetadata) {
    return metadata.indices.filter(
        (index) =>
            index.columns.length === 1 &&
            index.columns[0].databaseName ===
                metadata.discriminatorColumn!.databaseName,
    )
}

// https://github.com/typeorm/typeorm/issues/12840
describe("table-inheritance > single-table > discriminator-index-with-embedded", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                EmbeddedBase,
                EmbeddedChild,
                IndexedBase,
                IndexedChild,
                PlainBase,
                PlainChild,
            ],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mariadb",
                "mssql",
                "mysql",
                "oracle",
                "postgres",
            ],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should index the discriminator column of an entity with an embedded column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(EmbeddedBase)

                expect(discriminatorIndices(metadata)).to.have.length(1)

                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()
                const table = (await queryRunner.getTable("embedded_base"))!
                await queryRunner.release()

                const indices = table.indices.filter(
                    (index) =>
                        index.columnNames.length === 1 &&
                        index.columnNames[0] === "discriminator",
                )

                expect(indices).to.have.length(1)
            }),
        ))

    it("should not add a second index when the discriminator column is already indexed", () => {
        dataSources.forEach((dataSource) => {
            const metadata = dataSource.getMetadata(IndexedBase)
            const indices = discriminatorIndices(metadata)

            expect(indices).to.have.length(1)
            expect(indices[0].name).to.be.equal("IX_indexed_base_discriminator")
        })
    })

    it("should keep indexing the discriminator column of an entity without embedded columns", () => {
        dataSources.forEach((dataSource) => {
            const metadata = dataSource.getMetadata(PlainBase)

            expect(discriminatorIndices(metadata)).to.have.length(1)
        })
    })
})
