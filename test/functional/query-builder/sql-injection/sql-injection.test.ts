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
            disabledDrivers: ["spanner"],
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

    describe("addSelect", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        expect(() =>
                            dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .addSelect(malicious),
                        ).to.throw(/Semicolons are not allowed/)
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("andWhere", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
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
                                .getRepository(Post)
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
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        expect(() =>
                            dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .groupBy(malicious),
                        ).to.throw(/Semicolons are not allowed/)
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("having", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
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

    describe("orderBy", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        expect(() =>
                            dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .orderBy(malicious),
                        ).to.throw(/Semicolons are not allowed/)
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })

    describe("orderBy value injection", () => {
        it("should reject invalid order direction in OrderByCondition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    expect(() =>
                        dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            // @ts-expect-error intentionally invalid order direction
                            .orderBy({ "post.id": "ASC; DELETE FROM post;" }),
                    ).to.throw(/Invalid order direction/)
                    await verifyIntegrity(dataSource)()
                }),
            ))

        it("should reject invalid order direction in nested OrderByCondition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    expect(() =>
                        dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            // @ts-expect-error intentionally invalid order direction
                            .orderBy({
                                "post.id": { order: "ASC; DELETE FROM post;" },
                            }),
                    ).to.throw(/Invalid order direction/)
                    await verifyIntegrity(dataSource)()
                }),
            ))

        it("should reject invalid nulls option in OrderByCondition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    expect(() =>
                        dataSource
                            .getRepository(Post)
                            .createQueryBuilder("post")
                            // @ts-expect-error intentionally invalid nulls option
                            .orderBy({
                                "post.id": {
                                    order: "ASC",
                                    nulls: "NULLS FIRST; DROP TABLE post;",
                                },
                            }),
                    ).to.throw(/Invalid nulls option/)
                    await verifyIntegrity(dataSource)()
                }),
            ))

        it("should accept valid OrderByCondition values", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
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

                    await dataSource
                        .getRepository(Post)
                        .createQueryBuilder("post")
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
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .update(Post)
                            .set({ name: "test" })
                            // @ts-expect-error intentionally invalid order direction
                            .orderBy({ id: "ASC; DROP TABLE post;" }),
                    ).to.throw(/Invalid order direction/)
                }),
            ))

        it("should reject invalid order direction in SoftDeleteQueryBuilder", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .softDelete()
                            .from(Post)
                            // @ts-expect-error intentionally invalid order direction
                            .orderBy({ id: "ASC; DROP TABLE post;" }),
                    ).to.throw(/Invalid order direction/)
                }),
            ))
    })

    describe("base QueryBuilder.select() bypass prevention", () => {
        it("should reject semicolons in update().select()", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .update(Post)
                            .set({ name: "test" })
                            .select("1; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))

        it("should reject semicolons in delete().select()", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .delete()
                            .from(Post)
                            .select("1; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))

        it("should reject semicolons in select() array via base QueryBuilder", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .update(Post)
                            .set({ name: "test" })
                            .select(["id", "1; DELETE FROM post;"]),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))
    })

    describe("UpdateQueryBuilder orderBy semicolons", () => {
        it("should reject semicolons in orderBy sort key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .update(Post)
                            .set({ name: "test" })
                            .orderBy("id; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))

        it("should reject semicolons in addOrderBy sort key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .update(Post)
                            .set({ name: "test" })
                            .orderBy("id")
                            .addOrderBy("name; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))
    })

    describe("SoftDeleteQueryBuilder orderBy semicolons", () => {
        it("should reject semicolons in orderBy sort key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .softDelete()
                            .from(Post)
                            .orderBy("id; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))

        it("should reject semicolons in addOrderBy sort key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "mongodb") return

                    expect(() =>
                        dataSource
                            .createQueryBuilder()
                            .softDelete()
                            .from(Post)
                            .orderBy("id")
                            .addOrderBy("name; DELETE FROM post;"),
                    ).to.throw(/Semicolons are not allowed/)
                }),
            ))
    })

    describe("orWhere", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const results = await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
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

    describe("select", () => {
        for (const malicious of inputsWithSemicolons) {
            it(`should reject semicolons with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        expect(() =>
                            dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .select(malicious),
                        ).to.throw(/Semicolons are not allowed/)
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
                                .getRepository(Post)
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
                                .getRepository(Post)
                                .createQueryBuilder("post")
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

    describe("findOne", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            const result = await dataSource
                                .getRepository(Post)
                                .findOneBy({ name: malicious })
                            expect(result).to.be.null
                        } catch {
                            // some drivers reject invalid byte sequences
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
    })
})
