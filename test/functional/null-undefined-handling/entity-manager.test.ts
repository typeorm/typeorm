// See #12578
import "reflect-metadata"
import "../../utils/test-setup"
import type { DataSource } from "../../../src"
import { TypeORMError } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("entity manager > null and undefined handling with default behavior", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        const category1 = new Category()
        category1.name = "Category #1"
        await dataSource.manager.save(category1)

        const post1 = new Post()
        post1.title = "Post #1"
        post1.text = "About post #1"
        post1.category = category1
        await dataSource.manager.save(post1)

        const post2 = new Post()
        post2.title = "Post #2"
        post2.text = "About post #2"
        await dataSource.manager.save(post2)
    }

    describe("update() with default (unset) invalidWhereValuesBehavior", () => {
        it("should throw TypeORMError for undefined values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.update(
                            Post,
                            // @ts-expect-error - undefined should be marked as unsafe by default
                            { title: undefined },
                            { text: "Updated" },
                        )
                        expect.fail("Expected update to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Undefined value encountered",
                        )
                    }
                }),
            ))

        it("should throw TypeORMError for null values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.update(
                            Post,
                            // @ts-expect-error - null should be marked as unsafe by default
                            { title: null },
                            { text: "Updated" },
                        )
                        expect.fail("Expected update to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Null value encountered",
                        )
                    }
                }),
            ))
    })

    describe("delete() with default (unset) invalidWhereValuesBehavior", () => {
        it("should throw TypeORMError for undefined values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.delete(
                            Post,
                            // @ts-expect-error - undefined should be marked as unsafe by default
                            { title: undefined },
                        )
                        expect.fail("Expected delete to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Undefined value encountered",
                        )
                    }
                }),
            ))

        it("should throw TypeORMError for null values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.delete(
                            Post,
                            // @ts-expect-error - null should be marked as unsafe by default
                            { title: null },
                        )
                        expect.fail("Expected delete to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Null value encountered",
                        )
                    }
                }),
            ))
    })

    describe("softDelete() with default (unset) invalidWhereValuesBehavior", () => {
        it("should throw TypeORMError for undefined values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.softDelete(
                            Post,
                            // @ts-expect-error - undefined should be marked as unsafe by default
                            { title: undefined },
                        )
                        expect.fail("Expected softDelete to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Undefined value encountered",
                        )
                    }
                }),
            ))
    })

    describe("restore() with default (unset) invalidWhereValuesBehavior", () => {
        it("should throw TypeORMError for undefined values in where condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    try {
                        await dataSource.manager.restore(
                            Post,
                            // @ts-expect-error - undefined should be marked as unsafe by default
                            { title: undefined },
                        )
                        expect.fail("Expected restore to throw an error")
                    } catch (error) {
                        expect(error).to.be.instanceOf(TypeORMError)
                        expect(error.message).to.include(
                            "Undefined value encountered",
                        )
                    }
                }),
            ))
    })

    describe("with invalidWhereValuesBehavior set to ignore", () => {
        let ignoreDataSources: DataSource[]

        before(async () => {
            ignoreDataSources = await createTestingConnections({
                disabledDrivers: ["spanner"],
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
                driverSpecific: {
                    invalidWhereValuesBehavior: {
                        undefined: "ignore",
                        null: "ignore",
                    },
                },
            })
        })
        beforeEach(() => reloadTestingDatabases(ignoreDataSources))
        after(() => closeTestingConnections(ignoreDataSources))

        it("update() should skip undefined values instead of throwing", () =>
            Promise.all(
                ignoreDataSources.map(async (dataSource) => {
                    await prepareData(dataSource)

                    // Should not throw — undefined values are ignored
                    await dataSource.manager.update(
                        Post,
                        { title: "Post #1",
                        // @ts-expect-error - undefined should be marked as unsafe by default
                        text: undefined },
                        { text: "Updated" },
                    )

                    // Verify the update worked
                    const updated = await dataSource.manager.findOneBy(Post, {
                        title: "Post #1",
                    })
                    expect(updated).to.not.be.null
                    expect(updated!.text).to.equal("Updated")
                }),
            ))
    })
})
