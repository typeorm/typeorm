import { expect } from "chai"
import type { DataSource } from "../../../../src/"
import {
    LockNotSupportedOnGivenDriverError,
    NoVersionOrUpdateDateColumnError,
    OptimisticLockCanNotBeUsedError,
    OptimisticLockVersionMismatchError,
    PessimisticLockTransactionRequiredError,
} from "../../../../src/"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostWithoutVersionAndUpdateDate } from "./entity/PostWithoutVersionAndUpdateDate"
import { PostWithUpdateDate } from "./entity/PostWithUpdateDate"
import { PostWithVersion } from "./entity/PostWithVersion"
import { PostWithVersionAndUpdatedDate } from "./entity/PostWithVersionAndUpdatedDate"

describe("query builder > locking", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not attach pessimistic read lock statement on query if locking is not used", () => {
        for (const dataSource of dataSources) {
            if (
                DriverUtils.isSQLiteFamily(dataSource.driver) ||
                dataSource.driver.options.type === "spanner"
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).not.to.contain("LOCK IN SHARE MODE")
            expect(sql).not.to.contain("FOR SHARE")
            expect(sql).not.to.contain("WITH (HOLDLOCK, ROWLOCK)")
        }
    })

    it("should throw error if pessimistic lock used without transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    DriverUtils.isSQLiteFamily(dataSource.driver) ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    return
                }

                return Promise.all([
                    dataSource
                        .createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_read")
                        .where("post.id = :id", { id: 1 })
                        .getOne()
                        .should.be.rejectedWith(
                            PessimisticLockTransactionRequiredError,
                        ),

                    dataSource
                        .createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write")
                        .where("post.id = :id", { id: 1 })
                        .getOne()
                        .should.be.rejectedWith(
                            PessimisticLockTransactionRequiredError,
                        ),
                ])
            }),
        ))

    it("should not throw error if pessimistic lock used with transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    DriverUtils.isSQLiteFamily(dataSource.driver) ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    return
                }

                if (dataSource.driver.options.type === "cockroachdb") {
                    await dataSource.manager.transaction((entityManager) =>
                        entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("pessimistic_write")
                            .where("post.id = :id", { id: 1 })
                            .getOne(),
                    ).should.not.be.rejected

                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    Promise.all([
                        entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("pessimistic_read")
                            .where("post.id = :id", { id: 1 })
                            .getOne(),

                        entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("pessimistic_write")
                            .where("post.id = :id", { id: 1 })
                            .getOne(),
                    ]),
                ).should.not.be.rejected
            }),
        ))

    it("should throw error if for no key update lock used without transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("for_no_key_update")
                    .where("post.id = :id", { id: 1 })
                    .getOne()
                    .should.be.rejectedWith(
                        PessimisticLockTransactionRequiredError,
                    )
            }),
        ))

    it("should not throw error if for no key update lock used with transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    entityManager
                        .createQueryBuilder(PostWithVersion, "post")
                        .setLock("for_no_key_update")
                        .where("post.id = :id", { id: 1 })
                        .getOne(),
                ).should.not.be.rejected
            }),
        ))

    it("should throw error if for key share lock used without transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("for_key_share")
                    .where("post.id = :id", { id: 1 })
                    .getOne()
                    .should.be.rejectedWith(
                        PessimisticLockTransactionRequiredError,
                    )
            }),
        ))

    it("should not throw error if for key share lock used with transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    entityManager
                        .createQueryBuilder(PostWithVersion, "post")
                        .setLock("for_key_share")
                        .where("post.id = :id", { id: 1 })
                        .getOne(),
                ).should.not.be.rejected
            }),
        ))

    it("should attach pessimistic read lock statement on query if locking enabled", () => {
        for (const dataSource of dataSources) {
            if (
                DriverUtils.isSQLiteFamily(dataSource.driver) ||
                dataSource.driver.options.type === "spanner"
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_read")
                .where("post.id = :id", { id: 1 })
                .getSql()

            if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                if (
                    dataSource.driver.options.type === "mysql" &&
                    DriverUtils.isReleaseVersionOrGreater(
                        dataSource.driver,
                        "8.0",
                    )
                ) {
                    expect(sql).to.contain("FOR SHARE")
                } else {
                    expect(sql).to.contain("LOCK IN SHARE MODE")
                }
            } else if (DriverUtils.isPostgresFamily(dataSource.driver)) {
                expect(sql).to.contain("FOR SHARE")
            } else if (dataSource.driver.options.type === "sap") {
                expect(sql).to.contain("FOR SHARE LOCK")
            } else if (dataSource.driver.options.type === "oracle") {
                expect(sql).to.contain("FOR UPDATE")
            } else if (dataSource.driver.options.type === "mssql") {
                expect(sql).to.contain("WITH (HOLDLOCK, ROWLOCK)")
            }
        }
    })

    it("should attach dirty read lock statement on query if locking enabled", () => {
        for (const dataSource of dataSources) {
            if (!(dataSource.driver.options.type === "mssql")) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("dirty_read")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).to.contain("WITH (NOLOCK)")
        }
    })

    it("should not attach pessimistic write lock statement on query if locking is not used", () => {
        for (const dataSource of dataSources) {
            if (
                DriverUtils.isSQLiteFamily(dataSource.driver) ||
                dataSource.driver.options.type === "spanner"
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).not.to.contain("FOR UPDATE")
            expect(sql).not.to.contain("WITH (UPDLOCK, ROWLOCK)")
        }
    })

    it("should attach pessimistic write lock statement on query if locking enabled", () => {
        for (const dataSource of dataSources) {
            if (
                DriverUtils.isSQLiteFamily(dataSource.driver) ||
                dataSource.driver.options.type === "spanner"
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write")
                .where("post.id = :id", { id: 1 })
                .getSql()

            if (
                DriverUtils.isMySQLFamily(dataSource.driver) ||
                DriverUtils.isPostgresFamily(dataSource.driver) ||
                dataSource.driver.options.type === "oracle" ||
                dataSource.driver.options.type === "sap"
            ) {
                expect(sql).to.contain("FOR UPDATE")
            } else if (dataSource.driver.options.type === "mssql") {
                expect(sql).to.contain("WITH (UPDLOCK, ROWLOCK)")
            }
        }
    })

    it("should not attach for no key update lock statement on query if locking is not used", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).not.to.contain("FOR NO KEY UPDATE")
        }
    })

    it("should attach for no key update lock statement on query if locking enabled", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("for_no_key_update")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).to.contain("FOR NO KEY UPDATE")
        }
    })

    it("should not attach for key share lock statement on query if locking is not used", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).not.to.contain("FOR KEY SHARE")
        }
    })

    it("should attach for key share lock statement on query if locking enabled", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("for_key_share")
                .where("post.id = :id", { id: 1 })
                .getSql()

            expect(sql).to.contain("FOR KEY SHARE")
        }
    })

    it("should throw error if optimistic lock used with getMany method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getMany()
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError)
            }),
        ))

    it("should throw error if optimistic lock used with getCount method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getCount()
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError)
            }),
        ))

    it("should throw error if optimistic lock used with getManyAndCount method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getManyAndCount()
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError)
            }),
        ))

    it("should throw error if optimistic lock used with getRawMany method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .getRawMany()
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError)
            }),
        ))

    it("should throw error if optimistic lock used with getRawOne method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getRawOne()
                    .should.be.rejectedWith(OptimisticLockCanNotBeUsedError)
            }),
        ))

    it("should not throw error if optimistic lock used with getOne method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected
            }),
        ))

    it.skip("should throw error if entity does not have version and update date columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithoutVersionAndUpdateDate()
                post.title = "New post"
                await dataSource.manager.save(post)

                await dataSource
                    .createQueryBuilder(PostWithoutVersionAndUpdateDate, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getOne()
                    .should.be.rejectedWith(NoVersionOrUpdateDateColumnError)
            }),
        ))

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual version does not equal expected version", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithVersion()
                post.title = "New post"
                await dataSource.manager.save(post)

                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 2)
                    .where("post.id = :id", { id: 1 })
                    .getOne()
                    .should.be.rejectedWith(OptimisticLockVersionMismatchError)
            }),
        ))

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual version and expected versions are equal", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithVersion()
                post.title = "New post"
                await dataSource.manager.save(post)

                await dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("optimistic", 1)
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected
            }),
        ))

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual updated date does not equal expected updated date", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithUpdateDate()
                post.title = "New post"
                await dataSource.manager.save(post)

                await dataSource
                    .createQueryBuilder(PostWithUpdateDate, "post")
                    .setLock("optimistic", new Date(2017, 1, 1))
                    .where("post.id = :id", { id: 1 })
                    .getOne()
                    .should.be.rejectedWith(OptimisticLockVersionMismatchError)
            }),
        ))

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual updated date and expected updated date are equal", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "mssql") {
                    return
                }

                const post = new PostWithUpdateDate()
                post.title = "New post"
                await dataSource.manager.save(post)

                await dataSource
                    .createQueryBuilder(PostWithUpdateDate, "post")
                    .setLock("optimistic", post.updateDate)
                    .where("post.id = :id", { id: 1 })
                    .getOne().should.not.be.rejected
            }),
        ))

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should work if both version and update date columns applied", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithVersionAndUpdatedDate()
                post.title = "New post"
                await dataSource.manager.save(post)

                await Promise.all([
                    dataSource
                        .createQueryBuilder(
                            PostWithVersionAndUpdatedDate,
                            "post",
                        )
                        .setLock("optimistic", post.updateDate)
                        .where("post.id = :id", { id: 1 })
                        .getOne(),

                    dataSource
                        .createQueryBuilder(
                            PostWithVersionAndUpdatedDate,
                            "post",
                        )
                        .setLock("optimistic", 1)
                        .where("post.id = :id", { id: 1 })
                        .getOne(),
                ]).should.not.be.rejected
            }),
        ))

    it("should throw error if pessimistic locking not supported by given driver", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    DriverUtils.isSQLiteFamily(dataSource.driver) ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    await dataSource.manager
                        .transaction((entityManager) =>
                            Promise.all([
                                entityManager
                                    .createQueryBuilder(PostWithVersion, "post")
                                    .setLock("pessimistic_read")
                                    .where("post.id = :id", { id: 1 })
                                    .getOne(),

                                entityManager
                                    .createQueryBuilder(PostWithVersion, "post")
                                    .setLock("pessimistic_write")
                                    .where("post.id = :id", { id: 1 })
                                    .getOne(),
                            ]),
                        )
                        .should.be.rejectedWith(
                            LockNotSupportedOnGivenDriverError,
                        )
                }
            }),
        ))

    it("should throw error if for no key update locking not supported by given driver", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager
                    .transaction(async (entityManager) => {
                        await entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("for_no_key_update")
                            .where("post.id = :id", { id: 1 })
                            .getOne()
                    })
                    .should.be.rejectedWith(LockNotSupportedOnGivenDriverError)
            }),
        ))

    it("should throw error if for key share locking not supported by given driver", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager
                    .transaction(async (entityManager) => {
                        await entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("for_key_share")
                            .where("post.id = :id", { id: 1 })
                            .getOne()
                    })
                    .should.be.rejectedWith(LockNotSupportedOnGivenDriverError)
            }),
        ))

    it("should only specify locked tables in FOR UPDATE OF clause if argument is given", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(Post, "post")
                .innerJoin("post.author", "user")
                .setLock("pessimistic_write", undefined, ["user"])
                .getSql()

            expect(sql).to.match(/FOR UPDATE OF user$/)

            const sql2 = dataSource
                .createQueryBuilder(Post, "post")
                .innerJoin("post.author", "user")
                .setLock("pessimistic_write", undefined, ["post", "user"])
                .getSql()

            expect(sql2).to.match(/FOR UPDATE OF post, user$/)
        }
    })

    it("should not allow empty array for lockTables", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager
                    .transaction((entityManager) =>
                        entityManager
                            .createQueryBuilder(Post, "post")
                            .innerJoin("post.author", "user")
                            .setLock("pessimistic_write", undefined, [])
                            .getOne(),
                    )
                    .should.be.rejectedWith(
                        "lockTables cannot be an empty array",
                    )
            }),
        ))

    it("should throw error when specifying a table that is not part of the query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager
                    .transaction((entityManager) =>
                        entityManager
                            .createQueryBuilder(Post, "post")
                            .innerJoin("post.author", "user")
                            .setLock("pessimistic_write", undefined, ["img"])
                            .getOne(),
                    )
                    // With the exception being thrown the transaction is not closed. if ".should.be.rejectedWith" is added to the inner promise
                    .should.be.rejectedWith(
                        'relation "img" in FOR UPDATE clause not found in FROM clause',
                    )
            }),
        ))

    it("should allow on a left join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager
                    .transaction((entityManager) =>
                        Promise.all([
                            entityManager
                                .createQueryBuilder(Post, "post")
                                .leftJoin("post.author", "user")
                                .setLock("pessimistic_write", undefined, [
                                    "post",
                                ])
                                .getOne(),
                            entityManager
                                .createQueryBuilder(Post, "post")
                                .leftJoin("post.author", "user")
                                .setLock("pessimistic_write")
                                .getOne(),
                        ]),
                    )
                    // With the exception being thrown the transaction is not closed. if ".should.be.rejectedWith" is added to the inner promise
                    .should.be.rejectedWith(
                        "FOR UPDATE cannot be applied to the nullable side of an outer join",
                    )
            }),
        ))

    it("should allow using lockTables on all types of locking", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") {
                    return
                }

                await dataSource.manager.transaction(async (entityManager) => {
                    await Promise.all([
                        entityManager
                            .createQueryBuilder(Post, "post")
                            .leftJoin("post.author", "user")
                            .setLock("pessimistic_read", undefined, ["post"])
                            .getOne(),
                        entityManager
                            .createQueryBuilder(Post, "post")
                            .leftJoin("post.author", "user")
                            .setLock("pessimistic_write", undefined, ["post"])
                            .getOne(),
                        entityManager
                            .createQueryBuilder(Post, "post")
                            .leftJoin("post.author", "user")
                            .setLock("for_no_key_update", undefined, ["post"])
                            .getOne(),
                    ])
                }).should.not.be.rejected
            }),
        ))

    it("should allow locking a relation of a relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    entityManager
                        .createQueryBuilder(Post, "post")
                        .innerJoin("post.categories", "cat")
                        .innerJoin("cat.images", "img")
                        .setLock("pessimistic_write", undefined, ["img"])
                        .getOne(),
                ).should.not.be.rejected
            }),
        ))

    it("should allow locking a relation of a relation with select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    entityManager
                        .createQueryBuilder(Post, "post")
                        .innerJoinAndSelect("post.categories", "categories")
                        .innerJoinAndSelect("categories.images", "images")
                        .where("post.id = :id", { id: 1 })
                        .setLock("pessimistic_write", undefined, ["images"])
                        .getOne(),
                ).should.not.be.rejected
            }),
        ))

    it('skip_locked with "pessimistic_read"', () => {
        for (const dataSource of dataSources) {
            if (
                !(
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "sap" ||
                    (dataSource.driver.options.type === "mysql" &&
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0.0",
                        ))
                )
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_read")
                .setOnLocked("skip_locked")
                .where("post.id = :id", { id: 1 })
                .getSql()

            if (dataSource.driver.options.type === "sap") {
                expect(sql.endsWith("FOR SHARE LOCK IGNORE LOCKED")).to.be.true
            } else {
                expect(sql.endsWith("FOR SHARE SKIP LOCKED")).to.be.true
            }
        }
    })

    it('nowait with "pessimistic_read"', () => {
        for (const dataSource of dataSources) {
            if (
                !(
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "sap" ||
                    (dataSource.driver.options.type === "mysql" &&
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0.0",
                        ))
                )
            ) {
                return
            }

            const sql = dataSource
                .createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_read")
                .setOnLocked("nowait")
                .where("post.id = :id", { id: 1 })
                .getSql()

            if (dataSource.driver.options.type === "sap") {
                expect(sql.endsWith("FOR SHARE LOCK NOWAIT")).to.be.true
            } else {
                expect(sql.endsWith("FOR SHARE NOWAIT")).to.be.true
            }
        }
    })

    it('skip_locked with "pessimistic_read" check getOne', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "sap" ||
                    (dataSource.driver.options.type === "mysql" &&
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0.0",
                        ))
                ) {
                    await dataSource.manager.transaction((entityManager) =>
                        entityManager
                            .createQueryBuilder(PostWithVersion, "post")
                            .setLock("pessimistic_read")
                            .setOnLocked("skip_locked")
                            .where("post.id = :id", { id: 1 })
                            .getOne(),
                    ).should.not.be.rejected
                }
            }),
        ))

    it('skip_locked with "for_key_share" check getOne', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") {
                    return
                }

                await dataSource.manager.transaction((entityManager) =>
                    entityManager
                        .createQueryBuilder(PostWithVersion, "post")
                        .setLock("for_key_share")
                        .setOnLocked("skip_locked")
                        .where("post.id = :id", { id: 1 })
                        .getOne(),
                ).should.not.be.rejected
            }),
        ))

    it('skip_locked with "pessimistic_read" fails on early versions of MySQL', () =>
        dataSources.map((dataSource) => {
            if (
                dataSource.driver.options.type === "mysql" &&
                !DriverUtils.isReleaseVersionOrGreater(
                    dataSource.driver,
                    "8.0.0",
                )
            ) {
                const sql = dataSource
                    .createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_read")
                    .setOnLocked("nowait")
                    .where("post.id = :id", { id: 1 })
                    .getSql()

                expect(sql.endsWith("LOCK IN SHARE MODE")).to.be.true
            }
        }))
})
