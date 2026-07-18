import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Category } from "./entity/Category"
import { CategoryWithLevel } from "./entity/CategoryWithLevel"
import {
    CategoryWithSchema,
    schemaName as entitySchemaName,
} from "./entity/CategoryWithSchema"
import {
    CategoryWithSchemaInClosure,
    schemaName as closureSchemaName,
} from "./entity/CategoryWithSchemaInClosure"
import type { DataSourceOptions } from "../../../../src/data-source/DataSourceOptions"

describe("metadata-builder > closure-junction-entity-metadata", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: false,
        })
    })
    after(() => closeTestingConnections(dataSources))

    describe("entity metadata creation", () => {
        it("should create closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Category)

                expect(entityMetadata.closureJunctionTable).to.not.be.undefined
            }))

        it("should reference the parent closure entity metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Category)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(closureMetadata.parentClosureEntityMetadata).to.equal(
                    entityMetadata,
                )
            }))

        it("should set the closure junction table type", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Category)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(closureMetadata.tableType).to.equal("closure-junction")
            }))
    })
    describe("closure columns", () => {
        it("should create ancestor columns for all primary columns", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Category)
                const closureMetadata = entityMetadata.closureJunctionTable!

                const ancestorColumns = closureMetadata.columns.filter(
                    (column) => column.closureType === "ancestor",
                )

                expect(ancestorColumns.length).to.equal(
                    entityMetadata.primaryColumns.length,
                )
            }))

        it("should create descendant columns for all primary columns", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Category)
                const closureMetadata = entityMetadata.closureJunctionTable!

                const descendantColumns = closureMetadata.columns.filter(
                    (column) => column.closureType === "descendant",
                )

                expect(descendantColumns.length).to.equal(
                    entityMetadata.primaryColumns.length,
                )
            }))
    })

    describe("tree level column", () => {
        it("should add a level column when the parent entity defines a tree level column", () =>
            dataSources.map((dataSource) => {
                const metadata = dataSource.getMetadata(CategoryWithLevel)
                const closure = metadata.closureJunctionTable!

                const levelColumn = closure.columns.find(
                    (column) => column.propertyName === "level",
                )

                expect(levelColumn).to.not.be.undefined
                expect(levelColumn!.propertyName).to.equal("level")
            }))

        it("should not add a level column when the parent entity does not define a tree level column", () =>
            dataSources.map((dataSource) => {
                const metadata = dataSource.getMetadata(Category)
                const closure = metadata.closureJunctionTable!

                const levelColumn = closure.columns.find(
                    (column) => column.propertyName === "level",
                )

                expect(levelColumn).to.be.undefined
            }))
    })
})

describe("metadata-builder > closure-junction-entity-metadata > schema handling", () => {
    type SchemaCapableOptions = Extract<DataSourceOptions, { schema?: string }>
    const driversSupportingSchema = Object.freeze({
        cockroachdb: true,
        mssql: true,
        postgres: true,
        "postgres-js": true,
        spanner: true,
        oracle: false,
        sap: false,
    } satisfies Record<SchemaCapableOptions["type"], boolean>)
    const enabledDrivers = Object.entries(driversSupportingSchema)
        .filter(([_, use]) => use)
        .map(([type]) => type) as Array<keyof typeof driversSupportingSchema>
    const suiteSetup = async ({
        entities,
        dataSourceSchema,
    }: {
        entities: NonNullable<
            Parameters<typeof createTestingConnections>[0]
        >["entities"]
        dataSourceSchema: string | undefined
    }): Promise<{ dataSources: DataSource[] }> => {
        const harness = {
            dataSources: await createTestingConnections({
                entities,
                enabledDrivers,
                schema: dataSourceSchema,
                schemaCreate: false,
                dropSchema: false,
            }),
        }
        return harness
    }

    describe("schema not provided (undefined)", () => {
        let dataSources: DataSource[]
        const schemaName = undefined
        const Entity = Category

        before(async () => {
            ;({ dataSources } = await suiteSetup({
                entities: [Entity],
                dataSourceSchema: undefined,
            }))
        })
        after(() => closeTestingConnections(dataSources))

        it("should inherit database from the parent closure entity", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Entity)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(closureMetadata.database).to.equal(
                    entityMetadata.database,
                )
            }))
        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Entity)
                const closureMetadata = entityMetadata.closureJunctionTable!
                expect(
                    (dataSource.driver.options as SchemaCapableOptions).schema,
                ).to.equal(schemaName)
                expect(entityMetadata.schema).to.equal(schemaName)
                expect(closureMetadata.schema).to.equal(schemaName)
                expect(closureMetadata.tablePath).to.not.contain(".")
                expect(closureMetadata.tablePath).to.equal(
                    dataSource.driver.buildTableName(
                        closureMetadata.tableName,
                        schemaName,
                        undefined,
                    ),
                )
            }))
    })
    describe("schema defined in Entity decorator", () => {
        let dataSources: DataSource[]
        const schemaName = entitySchemaName
        const Entity = CategoryWithSchema

        before(async () => {
            ;({ dataSources } = await suiteSetup({
                entities: [Entity],
                dataSourceSchema: undefined,
            }))
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata =
                    dataSource.getMetadata(CategoryWithSchema)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(
                    (dataSource.driver.options as SchemaCapableOptions).schema,
                ).to.be.undefined
                expect(entityMetadata.schema).to.equal(schemaName)
                expect(closureMetadata.schema).to.equal(entityMetadata.schema)
                expect(closureMetadata.tablePath).to.equal(
                    dataSource.driver.buildTableName(
                        closureMetadata.tableName,
                        schemaName,
                        undefined,
                    ),
                )
            }))
        it("should build the closure table in the correct schema", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    try {
                        const entityMetadata =
                            dataSource.getMetadata(CategoryWithSchema)
                        const closureMetadata =
                            entityMetadata.closureJunctionTable!

                        const table = await queryRunner.getTable(
                            closureMetadata.tablePath,
                        )
                        expect(table).not.to.be.undefined
                    } finally {
                        await queryRunner.release()
                    }
                }),
            ))
    })
    describe("schema provided to dataSource options", () => {
        let dataSources: DataSource[]
        const schemaName = "my_datasource_schema"
        const Entity = Category

        before(async () => {
            ;({ dataSources } = await suiteSetup({
                entities: [Entity],
                dataSourceSchema: schemaName,
            }))
        })
        after(() => closeTestingConnections(dataSources))

        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Entity)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(
                    (dataSource.driver.options as SchemaCapableOptions).schema,
                ).to.equal(schemaName)
                expect(entityMetadata.schema).to.equal(schemaName)
                expect(closureMetadata.schema).to.equal(entityMetadata.schema)
                expect(closureMetadata.tablePath).to.equal(
                    dataSource.driver.buildTableName(
                        closureMetadata.tableName,
                        schemaName,
                        undefined,
                    ),
                )
            }))
    })
    describe("schema provided to Tree decorator options", () => {
        let dataSources: DataSource[]
        const schemaName = closureSchemaName
        const Entity = CategoryWithSchemaInClosure

        before(async () => {
            ;({ dataSources } = await suiteSetup({
                entities: [Entity],
                dataSourceSchema: undefined,
            }))
        })
        after(() => closeTestingConnections(dataSources))

        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const entityMetadata = dataSource.getMetadata(Entity)
                const closureMetadata = entityMetadata.closureJunctionTable!

                expect(
                    (dataSource.driver.options as SchemaCapableOptions).schema,
                ).to.be.undefined
                expect(entityMetadata.schema).to.equal(undefined)
                expect(closureMetadata.schema).to.equal(schemaName)
                expect(closureMetadata.tablePath).to.contain(
                    dataSource.driver.buildTableName(
                        closureMetadata.tableName,
                        schemaName,
                        undefined,
                    ),
                )
            }))
    })
})
