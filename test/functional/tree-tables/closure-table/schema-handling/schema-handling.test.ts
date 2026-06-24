import "reflect-metadata"
import type { ICategory } from "./entity/Category.interface"
import { Category } from "./entity/Category"
import { CategoryWithSchema } from "./entity/CategoryWithSchema"
import { CategoryWithSchemaInClosure } from "./entity/CategoryWithSchemaInClosure"
import { CategoryWithDifferentSchemaForClosure } from "./entity/CategoryWithDifferentSchemaForClosure"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSourceOptions } from "../../../../../src/data-source/DataSourceOptions"

type SchemaCapableOptions = Extract<DataSourceOptions, { schema?: string }>
const driversSupportingSchema = Object.freeze({
    cockroachdb: true,
    mssql: true,
    postgres: true,
    spanner: true,
    oracle: false,
    sap: false,
} satisfies Record<SchemaCapableOptions["type"], boolean>)
const enabledDrivers = Object.entries(driversSupportingSchema)
    .filter(([_, use]) => use)
    .map(([type]) => type) as Array<keyof typeof driversSupportingSchema>

describe("tree-tables > closure-table > schema-handling", () => {
    let dataSources: DataSource[]
    const defineSuite = (Entity: { new (...args: unknown[]): ICategory }) => {
        it(`Should find ancestors for ${Entity.name}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categoryRepository =
                        dataSource.getTreeRepository(Entity)

                    const a1 = new Entity()
                    a1.name = "a1"
                    await categoryRepository.save(a1)

                    const a11 = new Entity()
                    a11.name = "a11"
                    a11.parentCategory = a1
                    await categoryRepository.save(a11)

                    const a111 = new Entity()
                    a111.name = "a111"
                    a111.parentCategory = a11
                    await categoryRepository.save(a111)

                    const rootCategories = await categoryRepository.findRoots()
                    rootCategories.should.be.eql([
                        {
                            id: a1.id,
                            name: a1.name,
                        },
                    ])

                    const a11Parent = await categoryRepository.findAncestors(
                        a11,
                    )
                    a11Parent.length.should.be.equal(2)
                    a11Parent.should.deep.include({ id: a1.id, name: a1.name })
                    a11Parent.should.deep.include({
                        id: a11.id,
                        name: a11.name,
                    })

                    const a111Parent = await categoryRepository.findAncestors(
                        a111,
                    )
                    a111Parent.length.should.be.equal(3)
                    a111Parent.should.deep.include({ id: a1.id, name: a1.name })
                    a111Parent.should.deep.include({
                        id: a11.id,
                        name: a11.name,
                    })
                    a111Parent.should.deep.include({
                        id: a111.id,
                        name: a111.name,
                    })
                }),
            ))

        it(`Should find descendants for ${Entity.name}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categoryRepository =
                        dataSource.getTreeRepository(Entity)

                    const a1 = new Entity()
                    a1.name = "a1"
                    await categoryRepository.save(a1)

                    const a11 = new Entity()
                    a11.name = "a11"
                    a11.parentCategory = a1
                    await categoryRepository.save(a11)

                    const a111 = new Entity()
                    a111.name = "a111"
                    a111.parentCategory = a11
                    await categoryRepository.save(a111)

                    const a112 = new Entity()
                    a112.name = "a112"
                    a112.parentCategory = a11
                    await categoryRepository.save(a112)

                    const rootCategories = await categoryRepository.findRoots()
                    rootCategories.should.be.eql([
                        {
                            id: a1.id,
                            name: a1.name,
                        },
                    ])

                    const a1Children = await categoryRepository.findDescendants(
                        a1,
                    )
                    a1Children.length.should.be.equal(4)
                    a1Children.should.deep.include({ id: a1.id, name: a1.name })
                    a1Children.should.deep.include({
                        id: a11.id,
                        name: a11.name,
                    })
                    a1Children.should.deep.include({
                        id: a111.id,
                        name: a111.name,
                    })
                    a1Children.should.deep.include({
                        id: a112.id,
                        name: a112.name,
                    })
                }),
            ))

        it(`findTrees should load all ${Entity.name} roots and attached children`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categoryRepository =
                        dataSource.getTreeRepository(Entity)

                    const a1 = new Entity()
                    a1.name = "a1"

                    const a11 = new Entity()
                    a11.name = "a11"
                    a11.parentCategory = a1

                    const a12 = new Entity()
                    a12.name = "a12"
                    a12.parentCategory = a1

                    const a111 = new Entity()
                    a111.name = "a111"
                    a111.parentCategory = a11

                    const a112 = new Entity()
                    a112.name = "a112"
                    a112.parentCategory = a11

                    await categoryRepository.save(a1)
                    await categoryRepository.save([a11, a12])
                    await categoryRepository.save([a111, a112])

                    const categoriesTree = await categoryRepository.findTrees()

                    // using sort because some drivers returns arrays in wrong order
                    categoriesTree[0].childCategories.sort(
                        (a, b) => a.id - b.id,
                    )
                    categoriesTree[0].childCategories[0].childCategories.sort(
                        (a, b) => a.id - b.id,
                    )

                    categoriesTree.should.be.eql([
                        {
                            id: a1.id,
                            name: a1.name,
                            childCategories: [
                                {
                                    id: a11.id,
                                    name: a11.name,
                                    childCategories: [
                                        {
                                            id: a111.id,
                                            name: a111.name,
                                            childCategories: [],
                                        },
                                        {
                                            id: a112.id,
                                            name: a112.name,
                                            childCategories: [],
                                        },
                                    ],
                                },
                                {
                                    id: a12.id,
                                    name: a12.name,
                                    childCategories: [],
                                },
                            ],
                        },
                    ])
                }),
            ))
    }
    describe("schema not provided (undefined)", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Category],
                enabledDrivers,
                schema: undefined,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        defineSuite(Category)
    })
    describe("schema defined in Entity decorator", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Category, CategoryWithSchema],
                enabledDrivers,
                schema: undefined,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        defineSuite(Category)
        defineSuite(CategoryWithSchema)
    })
    describe("schema provided to dataSource options", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Category, CategoryWithSchema],
                enabledDrivers,
                schema: "my_schema",
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        defineSuite(Category)
        defineSuite(CategoryWithSchema)
    })
    describe("schema provided to Tree decorator", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [
                    Category,
                    CategoryWithSchema,
                    CategoryWithSchemaInClosure,
                ],
                enabledDrivers,
                schema: undefined,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        defineSuite(Category)
        defineSuite(CategoryWithSchema)
        defineSuite(CategoryWithSchemaInClosure)
    })
    describe("schema provided to Entity and Tree decorator both", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [
                    Category,
                    CategoryWithSchema,
                    CategoryWithSchemaInClosure,
                    CategoryWithDifferentSchemaForClosure,
                ],
                enabledDrivers,
                schema: undefined,
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        defineSuite(Category)
        defineSuite(CategoryWithSchema)
        defineSuite(CategoryWithSchemaInClosure)
        defineSuite(CategoryWithDifferentSchemaForClosure)
    })
})
