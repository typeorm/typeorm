import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { OrmUtils } from "../../../src/util/OrmUtils"
import { TypeORMError } from "../../../src/error"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #12578 default invalidWhereValuesBehavior is throw", () => {
    describe("OrmUtils.normalizeWhereCriteria", () => {
        it("should throw on undefined by default", () => {
            expect(() => {
                OrmUtils.normalizeWhereCriteria({ title: undefined })
            }).to.throw(TypeORMError, /Undefined value encountered/)
        })

        it("should throw on null by default", () => {
            expect(() => {
                OrmUtils.normalizeWhereCriteria({ title: null })
            }).to.throw(TypeORMError, /Null value encountered/)
        })

        it("should respect options if provided", () => {
            const res1 = OrmUtils.normalizeWhereCriteria(
                { title: undefined },
                { undefined: "ignore" },
            )
            expect(res1).to.deep.equal({})

            const res2 = OrmUtils.normalizeWhereCriteria(
                { title: null },
                { null: "ignore" },
            )
            expect(res2).to.deep.equal({})
        })
    })

    describe("EntityManager mutation safety guards", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["better-sqlite3", "sqljs"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should throw when updating with criteria that normalizes to empty", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    // Default behavior throws on undefined
                    await expect(
                        Promise.resolve().then(() =>
                            manager.update(
                                Post,
                                { title: undefined },
                                { description: "updated" },
                            ),
                        ),
                    ).to.be.rejectedWith(TypeORMError)
                }),
            ))

        it("should throw when updating with criteria that normalizes to empty under ignore options", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    ;(dataSource.options as any).invalidWhereValuesBehavior = {
                        undefined: "ignore",
                    }
                    const manager = dataSource.manager

                    await expect(
                        Promise.resolve().then(() =>
                            manager.update(
                                Post,
                                { title: undefined },
                                { description: "updated" },
                            ),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)

                    delete (dataSource.options as any)
                        .invalidWhereValuesBehavior
                }),
            ))

        it("should throw when deleting with criteria that normalizes to empty", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    ;(dataSource.options as any).invalidWhereValuesBehavior = {
                        undefined: "ignore",
                    }
                    const manager = dataSource.manager

                    await expect(
                        Promise.resolve().then(() =>
                            manager.delete(Post, { title: undefined }),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)

                    delete (dataSource.options as any)
                        .invalidWhereValuesBehavior
                }),
            ))

        it("should throw when softDeleting with criteria that normalizes to empty", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    ;(dataSource.options as any).invalidWhereValuesBehavior = {
                        undefined: "ignore",
                    }
                    const manager = dataSource.manager

                    await expect(
                        Promise.resolve().then(() =>
                            manager.softDelete(Post, { title: undefined }),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)

                    delete (dataSource.options as any)
                        .invalidWhereValuesBehavior
                }),
            ))

        it("should throw when restoring with criteria that normalizes to empty", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    ;(dataSource.options as any).invalidWhereValuesBehavior = {
                        undefined: "ignore",
                    }
                    const manager = dataSource.manager

                    await expect(
                        Promise.resolve().then(() =>
                            manager.restore(Post, { title: undefined }),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)

                    delete (dataSource.options as any)
                        .invalidWhereValuesBehavior
                }),
            ))
    })
})
