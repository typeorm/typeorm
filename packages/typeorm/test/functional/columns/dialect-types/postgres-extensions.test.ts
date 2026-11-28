import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { ExtensionValue } from "./entity-postgres-extension/ExtensionValue"

describe("columns > dialect types > PostgreSQL extensions", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExtensionValue],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("creates a citext override and retains case-insensitive comparison", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = await queryRunner.getTable(
                        "dialect_extension_value",
                    )
                    expect(table!.findColumnByName("name")!.type).to.equal(
                        "citext",
                    )
                } finally {
                    await queryRunner.release()
                }

                const repository = dataSource.getRepository(ExtensionValue)
                const inserted = await repository.save({ name: "MixedCase" })
                const found = await repository.findOneBy({ name: "mixedcase" })
                expect(found?.id).to.equal(inserted.id)
                expect(found?.name).to.equal("MixedCase")

                const schemaLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(schemaLog.upQueries).to.be.empty
                expect(schemaLog.downQueries).to.be.empty
                const column =
                    repository.metadata.findColumnWithPropertyName("name")!
                expect(column.type).to.equal("varchar")
                expect(column.length).to.equal("40")
            }),
        )
    })
})
