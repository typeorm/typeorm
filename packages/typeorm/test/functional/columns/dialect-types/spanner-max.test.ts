import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

describe("columns > dialect types > Spanner MAX length", () => {
    const entity = new EntitySchema<{
        id: number
        textValue: string
        bytesValue: Buffer
    }>({
        name: "SpannerMaxValue",
        tableName: "spanner_max_value",
        columns: {
            id: { type: Number, primary: true },
            textValue: {
                type: "string",
                length: 16,
                dialectTypes: { spanner: "string(max)" },
            },
            bytesValue: {
                type: "bytes",
                length: 16,
                dialectTypes: { spanner: "bytes(MAX)" },
            },
        },
    })
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [entity],
            enabledDrivers: ["spanner"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("stores values beyond logical lengths and leaves the schema unchanged", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table =
                        await queryRunner.getTable("spanner_max_value")
                    const textColumn = table!.findColumnByName("textValue")!
                    const bytesColumn = table!.findColumnByName("bytesValue")!
                    expect(textColumn.type).to.equal("string")
                    expect(textColumn.length).to.equal("max")
                    expect(bytesColumn.type).to.equal("bytes")
                    expect(bytesColumn.length).to.equal("max")
                } finally {
                    await queryRunner.release()
                }

                const repository = dataSource.getRepository(entity)
                const textValue = "漢字🙂-MAX".repeat(40)
                const bytesValue = Buffer.alloc(128, 0xa5)
                await repository.save({ id: 1, textValue, bytesValue })
                const loaded = await repository.findOneByOrFail({ id: 1 })
                expect(loaded.textValue).to.equal(textValue)
                expect(Buffer.from(loaded.bytesValue)).to.deep.equal(bytesValue)

                const schemaLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(schemaLog.upQueries).to.be.empty
                expect(schemaLog.downQueries).to.be.empty
                const metadata = dataSource.getMetadata(entity)
                for (const [name, type] of [
                    ["textValue", "string"],
                    ["bytesValue", "bytes"],
                ]) {
                    const column = metadata.findColumnWithPropertyName(name)!
                    expect(column.type).to.equal(type)
                    expect(column.length).to.equal("16")
                }
            }),
        )
    })
})
