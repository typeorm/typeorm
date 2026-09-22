import "reflect-metadata"

import { expect } from "chai"

import { DataSource } from "../../../../src"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import type { DataSourceOptions } from "../../../../src/data-source/DataSourceOptions"
import type { ColumnCommonOptions } from "../../../../src/decorator/options/ColumnCommonOptions"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > dialect types", () => {
    const invalidDriverKey: ColumnCommonOptions = {
        dialectTypes: {
            // @ts-expect-error dialectTypes keys must be supported driver names
            postgre: "jsonb",
        },
    }
    void invalidDriverKey

    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql", "mariadb", "better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create the column with the type declared for the current driver", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const payload = table!.findColumnByName("payload")!
                const level = table!.findColumnByName("level")!
                const aliasLevel = table!.findColumnByName("aliasLevel")!
                const shortText = table!.findColumnByName("shortText")!
                const amount = table!.findColumnByName("amount")!
                const createdAt = table!.findColumnByName("createdAt")!
                const createdAtZero = table!.findColumnByName("createdAtZero")!
                expect(shortText.isUnique).to.equal(true)

                switch (dataSource.driver.options.type) {
                    case "postgres":
                        expect(payload.type).to.equal("jsonb")
                        expect(level.type).to.equal("smallint")
                        expect(aliasLevel.type).to.equal("integer")
                        expect(shortText.type).to.equal("character varying")
                        expect(shortText.length).to.equal("10")
                        expect(amount.type).to.equal("numeric")
                        expect(amount.precision).to.equal(10)
                        expect(amount.scale).to.equal(2)
                        expect(createdAt.type).to.equal(
                            "timestamp without time zone",
                        )
                        expect(createdAt.precision).to.equal(3)
                        expect(createdAtZero.precision).to.equal(0)
                        break
                    case "mysql":
                    case "mariadb":
                        expect(payload.type).to.equal("json")
                        expect(level.type).to.equal("tinyint")
                        expect(aliasLevel.type).to.equal("tinyint")
                        expect(shortText.length).to.equal("40")
                        expect(amount.precision).to.equal(12)
                        expect(amount.scale).to.equal(4)
                        break
                    case "better-sqlite3":
                        expect(payload.type).to.equal("json")
                        expect(level.type).to.equal("tinyint")
                        break
                }
            }),
        )
    })

    it("should not report changed columns on a second synchronization", async () => {
        // the physical type differs from the logical one on the overriding
        // driver, but the comparison must use the same resolved type for
        // creation and detection, otherwise synchronize never settles
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                const shortText =
                    metadata.findColumnWithPropertyName("shortText")!
                const amount = metadata.findColumnWithPropertyName("amount")!
                const unique = metadata.uniques.find((item) =>
                    item.columns.includes(shortText),
                )
                const uniqueIndex = metadata.indices.find(
                    (item) => item.isUnique && item.columns.includes(shortText),
                )
                expect(unique ?? uniqueIndex).to.exist

                const queryRunner = dataSource.createQueryRunner()
                const before = await queryRunner.getTables()
                const syncQueries = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(syncQueries.upQueries).to.be.empty
                expect(syncQueries.downQueries).to.be.empty
                await dataSource.synchronize(false)
                const after = await queryRunner.getTables()
                await queryRunner.release()

                expect(after).to.be.deep.equal(before)
                expect(shortText.type).to.equal("varchar")
                expect(shortText.length).to.equal("40")
                expect(amount.type).to.equal("decimal")
                expect(amount.precision).to.equal(12)
                expect(amount.scale).to.equal(4)
                expect(
                    metadata.findColumnWithPropertyName("shortText"),
                ).to.equal(shortText)
                if (unique) expect(unique.columns).to.include(shortText)
                if (uniqueIndex)
                    expect(uniqueIndex.columns).to.include(shortText)
            }),
        )
    })

    it("should reject empty dialect type overrides during initialization", async () => {
        await Promise.all(
            dataSources.flatMap((source) =>
                ["", " "].map(async (override) => {
                    const entity = new EntitySchema({
                        name: "InvalidDialectType",
                        columns: {
                            id: { type: Number, primary: true },
                            payload: {
                                type: "json",
                                dialectTypes: {
                                    [source.driver.options.type]: override,
                                },
                            },
                        },
                    })
                    const dataSource = new DataSource({
                        ...source.options,
                        entities: [entity],
                        synchronize: false,
                        dropSchema: false,
                    } as DataSourceOptions)
                    await expect(dataSource.initialize()).to.be.rejectedWith(
                        "has an empty dialectTypes override",
                    )
                }),
            ),
        )
    })

    it("should reject unsupported override parameters", async () => {
        await Promise.all(
            dataSources.map(async (source) => {
                const entity = new EntitySchema({
                    name: "InvalidDialectParameters",
                    columns: {
                        id: { type: Number, primary: true },
                        payload: {
                            type: "varchar",
                            dialectTypes: {
                                [source.driver.options.type]: "varchar(10,2)",
                            },
                        },
                    },
                })
                const dataSource = new DataSource({
                    ...source.options,
                    entities: [entity],
                    synchronize: false,
                    dropSchema: false,
                } as DataSourceOptions)
                await expect(dataSource.initialize()).to.be.rejectedWith(
                    "has unsupported dialectTypes parameters",
                )
            }),
        )
    })

    it("should validate enum requirements on the physical override", async () => {
        await Promise.all(
            dataSources
                .filter((source) =>
                    source.driver.supportedDataTypes.includes("enum"),
                )
                .map(async (source) => {
                    const entity = new EntitySchema({
                        name: "InvalidDialectEnum",
                        columns: {
                            id: { type: Number, primary: true },
                            payload: {
                                type: "varchar",
                                dialectTypes: {
                                    [source.driver.options.type]: "enum",
                                },
                            },
                        },
                    })
                    const dataSource = new DataSource({
                        ...source.options,
                        entities: [entity],
                        synchronize: false,
                        dropSchema: false,
                    } as DataSourceOptions)
                    await expect(dataSource.initialize()).to.be.rejectedWith(
                        'is defined as enum, but missing "enum" or "enumName"',
                    )
                }),
        )
    })
})
