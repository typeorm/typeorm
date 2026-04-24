import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("query builder > sql injection", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["mongodb", "spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)
                const seed = new Post()
                seed.id = 1
                seed.version = 1
                seed.name = "seed"
                seed.text = "text"
                seed.tag = "tag"
                await repo.save(seed)

                const other = new Post()
                other.id = 2
                other.version = 2
                other.name = "other"
                other.text = "other text"
                other.tag = "other tag"
                await repo.save(other)
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    const maliciousInputs = [
        "'; DROP TABLE post; --",
        "test' OR '1'='1",
        "1; DELETE FROM post;",
        "' UNION SELECT * FROM post --",
        "\\'; DROP TABLE post; --",
        '"; DROP TABLE post; --',
        "'/**/OR/**/1=1--",
        "'' OR ''='",
        "0x27 OR 1=1--",
        "\x00'; DROP TABLE post;--",
        "' OR SLEEP(5)--",
        "1 OR 1=1",
    ]

    const inputsWithSemicolons = maliciousInputs.filter((input) =>
        input.includes(";"),
    )

    function verifyIntegrity(dataSource: DataSource) {
        return async () => {
            const count = await dataSource.getRepository(Post).count()
            expect(count).to.equal(2)
        }
    }

    // Builder factories typed `any` so the tests can drive them by method
    // name and pass loose strings through to the runtime allow-list without
    // per-call `as any` casts.
    type BuilderFactory = (dataSource: DataSource) => any

    const selectBuilder: BuilderFactory = (dataSource) =>
        dataSource.getRepository(Post).createQueryBuilder("post")

    const updateBuilder: BuilderFactory = (dataSource) =>
        dataSource.createQueryBuilder().update(Post).set({ name: "test" })

    const softDeleteBuilder: BuilderFactory = (dataSource) =>
        dataSource.createQueryBuilder().softDelete().from(Post)

    /**
     * Drives the given method with a raw-SQL `input` on every dataSource and
     * expects the flat-reject semicolon guard to throw. Used by the tests
     * that exercise `groupBy` / `addGroupBy` / `orderBy` (string form) /
     * `addOrderBy` across every query builder that surfaces them.
     */
    async function expectRejectsSemicolon(
        factory: BuilderFactory,
        method: string,
        input: string,
    ): Promise<void> {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                expect(() => factory(dataSource)[method](input)).to.throw(
                    /Semicolons are not allowed/,
                )
                await verifyIntegrity(dataSource)()
            }),
        )
    }

    /**
     * Drives `orderBy` / `addOrderBy` with a deliberately-out-of-enum `order`
     * or `nulls` value and expects the shared allow-list to throw. Factories
     * are loose-typed, so the call site passes raw strings without `as any`.
     */
    function expectRejectsInvalidOrderOption(
        factory: BuilderFactory,
        method: "orderBy" | "addOrderBy",
        sort: string,
        order: string,
        nulls: string | undefined,
    ): void {
        const pattern = /"(order|nulls)" can accept only/
        for (const dataSource of dataSources) {
            expect(() =>
                factory(dataSource)[method](sort, order, nulls),
            ).to.throw(pattern)
        }
    }

    /**
     * Drives the object-form `orderBy` with an `OrderByCondition` whose value
     * is deliberately outside the expected shape, to exercise
     * `validateOrderByCondition`. `sort` is typed `unknown` so invalid
     * values don't need `as any` at the call site.
     */
    function expectRejectsOrderByCondition(
        factory: BuilderFactory,
        sort: unknown,
        pattern: RegExp,
    ): void {
        for (const dataSource of dataSources) {
            expect(() => factory(dataSource).orderBy(sort)).to.throw(pattern)
        }
    }

    describe("addGroupBy", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                expectRejectsSemicolon(selectBuilder, "addGroupBy", malicious))
        }
    })

    describe("addOrderBy", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                expectRejectsSemicolon(selectBuilder, "addOrderBy", malicious))
        }
    })

    describe("andWhere", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .createQueryBuilder(Post, "post")
                                .where("post.id = :id", { id: 1 })
                                .andWhere("post.name = :name", {
                                    name: malicious,
                                })
                                .getMany()
                            expect(results).to.have.length(0)
                        } catch {
                            // some drivers reject certain byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("delete", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .createQueryBuilder()
                                .delete()
                                .from(Post)
                                .where("name = :name", { name: malicious })
                                .execute()
                        } catch {
                            // some drivers reject certain inputs
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("groupBy", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                expectRejectsSemicolon(selectBuilder, "groupBy", malicious))
        }
    })

    describe("having", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .createQueryBuilder(Post, "post")
                                .groupBy("post.id")
                                .having("post.name = :name", {
                                    name: malicious,
                                })
                                .getRawMany()
                        } catch {
                            // expected to throw on invalid expression
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("orderBy (string sort key)", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                expectRejectsSemicolon(selectBuilder, "orderBy", malicious))
        }

        it("should reject semicolons in OrderByCondition keys", () => {
            for (const dataSource of dataSources) {
                expect(() =>
                    dataSource.createQueryBuilder(Post, "post").orderBy({
                        "post.id; DELETE FROM post": "ASC",
                    }),
                ).to.throw(/Semicolons are not allowed/)
            }
        })

        // Update / SoftDelete builders share the same sort-key and allow-list
        // guards via QueryBuilder; loop across both to pin every call path.
        for (const [name, factory] of [
            ["UpdateQueryBuilder", updateBuilder] as const,
            ["SoftDeleteQueryBuilder", softDeleteBuilder] as const,
        ]) {
            it(`should reject semicolons in ${name} orderBy sort key`, () =>
                expectRejectsSemicolon(
                    factory,
                    "orderBy",
                    "id; DROP TABLE post",
                ))

            it(`should reject semicolons in ${name} addOrderBy sort key`, () =>
                expectRejectsSemicolon(
                    factory,
                    "addOrderBy",
                    "id; DROP TABLE post",
                ))

            it(`should reject semicolons in ${name} OrderByCondition keys`, () => {
                for (const dataSource of dataSources) {
                    expect(() =>
                        factory(dataSource).orderBy({
                            "id; DELETE FROM post": "ASC",
                        }),
                    ).to.throw(/Semicolons are not allowed/)
                }
            })

            it(`should reject invalid order value in ${name} orderBy`, () =>
                expectRejectsInvalidOrderOption(
                    factory,
                    "orderBy",
                    "id",
                    "ASC; DROP TABLE post",
                    undefined,
                ))

            it(`should reject invalid order value in ${name} addOrderBy`, () =>
                expectRejectsInvalidOrderOption(
                    factory,
                    "addOrderBy",
                    "id",
                    "ASC; DROP TABLE post",
                    undefined,
                ))

            it(`should reject invalid nulls value in ${name} orderBy`, () =>
                expectRejectsInvalidOrderOption(
                    factory,
                    "orderBy",
                    "id",
                    "ASC",
                    "NULLS FIRST; DROP TABLE post",
                ))
        }
    })

    describe("orderBy value injection", () => {
        it("should reject invalid order direction in OrderByCondition", () =>
            expectRejectsOrderByCondition(
                selectBuilder,
                { "post.id": "ASC; DELETE FROM post;" },
                /Invalid order direction/,
            ))

        it("should reject invalid nulls option in OrderByCondition", () =>
            expectRejectsOrderByCondition(
                selectBuilder,
                {
                    "post.id": {
                        order: "ASC",
                        nulls: "NULLS FIRST; DROP TABLE post;",
                    },
                },
                /Invalid nulls option/,
            ))

        it("should accept valid OrderByCondition values", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await selectBuilder(dataSource)
                        .orderBy({
                            "post.id": "DESC",
                            "post.name": "ASC",
                        })
                        .getMany()
                }),
            ))

        it("should accept valid OrderByCondition with nulls option", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        DriverUtils.isMySQLFamily(dataSource.driver) ||
                        dataSource.driver.options.type === "mssql"
                    )
                        return

                    await selectBuilder(dataSource)
                        .orderBy({
                            "post.id": "DESC",
                            "post.name": {
                                order: "ASC",
                                nulls: "NULLS LAST",
                            },
                        })
                        .getMany()
                }),
            ))

        it("should reject invalid order direction in UpdateQueryBuilder", () =>
            expectRejectsOrderByCondition(
                updateBuilder,
                { id: "ASC; DROP TABLE post;" },
                /Invalid order direction/,
            ))

        it("should reject invalid order direction in SoftDeleteQueryBuilder", () =>
            expectRejectsOrderByCondition(
                softDeleteBuilder,
                { id: "ASC; DROP TABLE post;" },
                /Invalid order direction/,
            ))
    })

    describe("orWhere", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .createQueryBuilder(Post, "post")
                                .where("post.name = :name1", {
                                    name1: "nonexistent",
                                })
                                .orWhere("post.name = :name2", {
                                    name2: malicious,
                                })
                                .getMany()
                            expect(results).to.have.length(0)
                        } catch {
                            // some drivers reject certain byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("update", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .createQueryBuilder()
                                .update(Post)
                                .set({ text: "updated" })
                                .where("name = :name", { name: malicious })
                                .execute()
                            const posts = await dataSource
                                .getRepository(Post)
                                .find()
                            expect(posts).to.have.length(2)
                            for (const post of posts) {
                                expect(post.text).to.not.equal("updated")
                            }
                        } catch {
                            // some drivers reject certain inputs
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("where", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .createQueryBuilder(Post, "post")
                                .where("post.name = :name", {
                                    name: malicious,
                                })
                                .getMany()
                            expect(results).to.have.length(0)
                        } catch {
                            // some drivers reject certain byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })
})
