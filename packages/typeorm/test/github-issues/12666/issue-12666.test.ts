import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { PessimisticLockTransactionRequiredError } from "../../../src/"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("github issues > #12666 take(0) combined with a join returns all rows instead of an empty array", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            disabledDrivers: ["spanner"],
            schemaCreate: true,
            dropSchema: true,
            cache: { duration: 60000 },
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const categories = await dataSource
                    .getRepository(Category)
                    .save([{ name: "a" }, { name: "b" }, { name: "c" }])

                await dataSource.getRepository(Post).save([
                    {
                        title: "post #1",
                        categories: [categories[0], categories[1]],
                    },
                    {
                        title: "post #2",
                        categories: [categories[1], categories[2]],
                    },
                    {
                        title: "post #3",
                        categories: [categories[0], categories[2]],
                    },
                ])
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should return an empty result set for take(0) with a join, like the no-join path already does", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const withJoin = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .take(0)
                    .getMany()
                expect(withJoin).to.have.length(0)

                // sanity: the no-join path is already correct and must stay so
                const withoutJoin = await dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id")
                    .take(0)
                    .getMany()
                expect(withoutJoin).to.have.length(0)
            }),
        ))

    it("should report zero rows but the full count from getManyAndCount for take(0) with a join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const [rows, count] = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .take(0)
                    .getManyAndCount()

                expect(rows).to.have.length(0)
                expect(count).to.equal(3)
            }),
        ))

    it("should let an explicit limit() keep its precedence over take(0)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const rows = await dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id")
                    .limit(2)
                    .take(0)
                    .getMany()

                expect(rows).to.have.length(2)
            }),
        ))

    it("should still run a writable CTE for take(0), since it modifies data on its own", () =>
        Promise.all(
            dataSources
                .filter(
                    (dataSource) => dataSource.driver.cteCapabilities.writable,
                )
                .map(async (dataSource) => {
                    const insert = dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(Category)
                        .values({ name: "d" })

                    const rows = await dataSource
                        .createQueryBuilder(Post, "post")
                        .addCommonTableExpression(insert, "inserted")
                        .leftJoinAndSelect("post.categories", "category")
                        .orderBy("post.id")
                        .take(0)
                        .getMany()

                    expect(rows).to.have.length(0)
                    expect(
                        await dataSource
                            .getRepository(Category)
                            .countBy({ name: "d" }),
                    ).to.equal(1)
                }),
        ))

    it("should run a writable CTE once for take(0), even when getManyAndCount also counts", () =>
        Promise.all(
            dataSources
                .filter(
                    (dataSource) => dataSource.driver.cteCapabilities.writable,
                )
                .map(async (dataSource) => {
                    const insert = dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(Category)
                        .values({ name: "d" })

                    const [rows, count] = await dataSource
                        .createQueryBuilder(Post, "post")
                        .addCommonTableExpression(insert, "inserted")
                        .leftJoinAndSelect("post.categories", "category")
                        .orderBy("post.id")
                        .take(0)
                        .getManyAndCount()

                    expect(rows).to.have.length(0)
                    expect(count).to.equal(3)
                    expect(
                        await dataSource
                            .getRepository(Category)
                            .countBy({ name: "d" }),
                    ).to.equal(1)
                }),
        ))

    for (const alwaysEnabled of [false, true]) {
        for (const method of [
            "getMany",
            "getOne",
            "getManyAndCount",
        ] as const) {
            it(`should execute a writable CTE on every ${method} with take(0) and ${alwaysEnabled ? "global" : "explicit"} caching`, () =>
                Promise.all(
                    dataSources
                        .filter(
                            (dataSource) =>
                                dataSource.driver.cteCapabilities.writable,
                        )
                        .map(async (dataSource) => {
                            const cacheOptions = dataSource.options.cache as {
                                alwaysEnabled?: boolean
                            }
                            cacheOptions.alwaysEnabled = alwaysEnabled
                            try {
                                const insert = dataSource
                                    .createQueryBuilder()
                                    .insert()
                                    .into(Category)
                                    .values({ name: "cached-write" })
                                const query = dataSource
                                    .createQueryBuilder(Post, "post")
                                    .addCommonTableExpression(
                                        insert,
                                        "inserted",
                                    )
                                    .leftJoinAndSelect(
                                        "post.categories",
                                        "category",
                                    )
                                    .take(0)
                                if (!alwaysEnabled) query.cache(true)

                                for (
                                    let execution = 1;
                                    execution <= 2;
                                    execution++
                                ) {
                                    const result = await query[method]()
                                    if (method === "getManyAndCount") {
                                        expect(result).to.deep.equal([[], 3])
                                    } else {
                                        expect(result).to.deep.equal(
                                            method === "getOne" ? null : [],
                                        )
                                    }
                                    const writes = await dataSource
                                        .createQueryBuilder(
                                            Category,
                                            "category",
                                        )
                                        .where("category.name = :name", {
                                            name: "cached-write",
                                        })
                                        .cache(false)
                                        .getCount()
                                    expect(writes).to.equal(execution)
                                    expect(query.expressionMap.cache).to.equal(
                                        alwaysEnabled ? undefined : true,
                                    )
                                }
                            } finally {
                                cacheOptions.alwaysEnabled = false
                            }
                        }),
                ))
        }
    }

    it("should preserve count caching for take(0) without a CTE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const query = dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .take(0)
                    .cache(true)

                expect(await query.getManyAndCount()).to.deep.equal([[], 3])
                await dataSource.getRepository(Post).save({ title: "post #4" })
                expect(await query.getManyAndCount()).to.deep.equal([[], 3])
                expect(
                    await query.cache(false).getManyAndCount(),
                ).to.deep.equal([[], 4])
            }),
        ))

    it("should still require a transaction for a pessimistic lock, even for take(0)", () =>
        Promise.all(
            dataSources
                .filter(
                    (dataSource) =>
                        !DriverUtils.isSQLiteFamily(dataSource.driver) &&
                        dataSource.driver.options.type !== "spanner",
                )
                .map((dataSource) =>
                    dataSource
                        .createQueryBuilder(Post, "post")
                        .setLock("pessimistic_write")
                        .take(0)
                        .getManyAndCount()
                        .should.be.rejectedWith(
                            PessimisticLockTransactionRequiredError,
                        ),
                ),
        ))

    it("should still return all rows for skip(0) with a join, since offset 0 is a no-op", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const rows = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .skip(0)
                    .getMany()

                expect(rows).to.have.length(3)
            }),
        ))
})
