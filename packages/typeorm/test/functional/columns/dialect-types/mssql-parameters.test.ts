import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import type { EntitySchemaColumnOptions } from "../../../../src/entity-schema/EntitySchemaColumnOptions"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

describe("columns > dialect types > MSSQL parameters", () => {
    const entity = new EntitySchema({
        name: "DialectParameters",
        columns: {
            id: { type: Number, primary: true },
            amount: {
                type: "decimal",
                dialectTypes: { mssql: "decimal(38,38)" },
            },
            embedding: {
                type: "varchar",
                dialectTypes: { mssql: "vector(3)" },
            },
            inheritedEmbedding: {
                type: "varchar",
                length: 3,
                dialectTypes: { mssql: "vector" },
            },
            createdAt: {
                type: "datetime",
                dialectTypes: { mssql: "datetime2(0)" },
            },
            maxText: {
                type: "varchar",
                length: 10,
                dialectTypes: { mssql: "varchar(max)" },
            },
            maxUnicode: {
                type: "nvarchar",
                length: 10,
                dialectTypes: { mssql: "nvarchar(MAX)" },
            },
            maxBinary: {
                type: "varbinary",
                length: 16,
                dialectTypes: { mssql: "varbinary(max)" },
            },
        },
    })
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [entity],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should reject invalid decimal and vector overrides during initialization", async () => {
        const invalidColumns: EntitySchemaColumnOptions[] = [
            { type: "decimal", dialectTypes: { mssql: "decimal(2,5)" } },
            { type: "decimal", dialectTypes: { mssql: "decimal(0,0)" } },
            { type: "decimal", dialectTypes: { mssql: "numeric(39,0)" } },
            { type: "decimal", dialectTypes: { mssql: "decimal(38,39)" } },
            {
                type: "decimal",
                precision: 2,
                scale: 5,
                dialectTypes: { mssql: "decimal" },
            },
            { type: "varchar", dialectTypes: { mssql: "vector" } },
            { type: "varchar", dialectTypes: { mssql: "vector(1999)" } },
        ]
        await Promise.all(
            dataSources.map(async (source) => {
                for (const column of invalidColumns) {
                    const invalidEntity = new EntitySchema({
                        name: "InvalidDialectParameters",
                        columns: {
                            id: { type: Number, primary: true },
                            value: column,
                        },
                    })
                    const dataSource = new DataSource({
                        ...source.options,
                        entities: [invalidEntity],
                        synchronize: false,
                        dropSchema: false,
                    })
                    await expect(dataSource.initialize()).to.be.rejectedWith(
                        'has invalid dialectTypes parameters for "mssql"',
                    )
                }
            }),
        )
    })

    it("should reject max on unsupported types and in precision or scale parameters", async () => {
        await Promise.all(
            dataSources.map(async (source) => {
                for (const override of [
                    "char(max)",
                    "nchar(max)",
                    "binary(max)",
                    "vector(max)",
                    "decimal(max)",
                    "nvarchar(max,2)",
                    "decimal(10,max)",
                ]) {
                    const invalidEntity = new EntitySchema({
                        name: "InvalidMaxLength",
                        columns: {
                            id: { type: Number, primary: true },
                            value: {
                                type: "varchar",
                                dialectTypes: { mssql: override },
                            },
                        },
                    })
                    const dataSource = new DataSource({
                        ...source.options,
                        entities: [invalidEntity],
                        synchronize: false,
                        dropSchema: false,
                    })
                    await expect(dataSource.initialize()).to.be.rejectedWith(
                        /has (invalid|unsupported) dialectTypes parameters/,
                    )
                }
            }),
        )
    })

    it("should bind and return values beyond the bounded string and binary lengths", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const maxText = "a".repeat(9000)
                const maxUnicode = "漢".repeat(5000)
                const maxBinary = Buffer.alloc(9000, 0xab)
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(entity)
                    .values({
                        id: 1,
                        amount: () => "0.5",
                        embedding: () => "'[1,2,3]'",
                        inheritedEmbedding: () => "'[1,2,3]'",
                        createdAt: new Date("2024-01-01T00:00:00Z"),
                        maxText,
                        maxUnicode,
                        maxBinary,
                    })
                    .returning(["maxText", "maxUnicode", "maxBinary"])
                    .execute()
                expect(result.raw[0].maxText).to.equal(maxText)
                expect(result.raw[0].maxUnicode).to.equal(maxUnicode)
                expect(result.raw[0].maxBinary).to.deep.equal(maxBinary)

                const found = await dataSource
                    .getRepository(entity)
                    .findOneByOrFail({ id: 1 })
                expect(found.maxText).to.equal(maxText)
                expect(found.maxUnicode).to.equal(maxUnicode)
                expect(found.maxBinary).to.deep.equal(maxBinary)
                for (const [name, length] of [
                    ["maxText", "10"],
                    ["maxUnicode", "10"],
                    ["maxBinary", "16"],
                ]) {
                    expect(
                        dataSource
                            .getMetadata(entity)
                            .findColumnWithPropertyName(name)!.length,
                    ).to.equal(length)
                }
            }),
        )
    })

    it("should create valid decimal and vector overrides and preserve zero time precision", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table =
                        await queryRunner.getTable("dialect_parameters")
                    expect(
                        table!.findColumnByName("amount")!.precision,
                    ).to.equal(38)
                    expect(table!.findColumnByName("amount")!.scale).to.equal(
                        38,
                    )
                    for (const name of ["embedding", "inheritedEmbedding"]) {
                        const column = table!.findColumnByName(name)!
                        expect(column.type).to.equal("vector")
                        expect(column.length).to.equal("3")
                    }
                    expect(
                        table!.findColumnByName("createdAt")!.precision,
                    ).to.equal(0)
                    for (const [name, type] of [
                        ["maxText", "varchar"],
                        ["maxUnicode", "nvarchar"],
                        ["maxBinary", "varbinary"],
                    ]) {
                        const column = table!.findColumnByName(name)!
                        expect(column.type).to.equal(type)
                        expect(column.length).to.equal("MAX")
                    }
                    const queries = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(queries.upQueries).to.be.empty
                    expect(queries.downQueries).to.be.empty
                    const column = dataSource
                        .getMetadata(entity)
                        .findColumnWithPropertyName("inheritedEmbedding")!
                    expect(column.type).to.equal("varchar")
                    expect(column.length).to.equal("3")
                } finally {
                    await queryRunner.release()
                }
            }),
        )
    })
})
