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
import { CategoryWithSchema } from "./entity/CategoryWithSchema"
import type { PostgresDataSourceOptions } from "../../../../src/driver/postgres/PostgresDataSourceOptions.js"

describe("metadata-builder > closure-junction-entity-metadata", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: false,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("entity metadata creation", () => {
        it("should create closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)

                expect(spaceMetadata.closureJunctionTable).to.not.be.undefined
            }))

        it("should reference the parent closure entity metadata", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(closureMetadata.parentClosureEntityMetadata).to.equal(
                    spaceMetadata,
                )
            }))

        it("should set the closure junction table type", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(closureMetadata.tableType).to.equal("closure-junction")
            }))
    })
    describe("closure columns", () => {
        it("should create ancestor columns for all primary columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const spaceMetadata = dataSource.getMetadata(Category)
                    const closureMetadata = spaceMetadata.closureJunctionTable!

                    const ancestorColumns = closureMetadata.columns.filter(
                        (column) => column.closureType === "ancestor",
                    )

                    expect(ancestorColumns.length).to.equal(
                        spaceMetadata.primaryColumns.length,
                    )
                }),
            ))

        it("should create descendant columns for all primary columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const spaceMetadata = dataSource.getMetadata(Category)
                    const closureMetadata = spaceMetadata.closureJunctionTable!

                    const descendantColumns = closureMetadata.columns.filter(
                        (column) => column.closureType === "descendant",
                    )

                    expect(descendantColumns.length).to.equal(
                        spaceMetadata.primaryColumns.length,
                    )
                }),
            ))
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
    describe("schema not provided (undefined)", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                // NOTE: This does not overwrite schema passed in configuration
                // for that to work, setupTestingConnections should use Object.hasOwn(options, "schema") and then replace
                schema: undefined,
                schemaCreate: false,
                dropSchema: false,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should inherit database from the parent closure entity", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(closureMetadata.database).to.equal(
                    spaceMetadata.database,
                )
            }))
        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!
                expect(
                    (dataSource.driver.options as PostgresDataSourceOptions)
                        .schema,
                ).to.be.undefined
                expect(spaceMetadata.schema).to.be.undefined
                expect(closureMetadata.schema).to.be.undefined
                expect(closureMetadata.tablePath).to.not.contain(".")
                expect(closureMetadata.tablePath).to.equal(
                    closureMetadata.tableName,
                )
            }))
    })
    describe("schema defined in Entity decorator", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                schema: undefined,
                schemaCreate: false,
                dropSchema: false,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should inherit database from the parent closure entity", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(closureMetadata.database).to.equal(
                    spaceMetadata.database,
                )
            }))
        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(CategoryWithSchema)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(
                    (dataSource.driver.options as PostgresDataSourceOptions)
                        .schema,
                ).to.be.undefined
                expect(spaceMetadata.schema).to.equal("my_schema")
                expect(closureMetadata.schema).to.equal(spaceMetadata.schema)
                expect(closureMetadata.tablePath).to.contain(
                    spaceMetadata.schema,
                )
            }))
    })
    describe("schema provided to dataSource options", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                schema: "my_schema",
                schemaCreate: false,
                dropSchema: false,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should inherit database from the parent closure entity", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(closureMetadata.database).to.equal(
                    spaceMetadata.database,
                )
            }))
        it("should propagate schema into closure junction metadata", () =>
            dataSources.map((dataSource) => {
                const spaceMetadata = dataSource.getMetadata(Category)
                const closureMetadata = spaceMetadata.closureJunctionTable!

                expect(
                    (dataSource.driver.options as PostgresDataSourceOptions)
                        .schema,
                ).to.equal("my_schema")
                expect(spaceMetadata.schema).to.equal("my_schema")
                expect(closureMetadata.schema).to.equal(spaceMetadata.schema)
                expect(closureMetadata.tablePath).to.contain(
                    spaceMetadata.schema,
                )
            }))
    })
    describe("schema provided to Tree decorator", () => {})
})
