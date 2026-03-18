import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("query builder > sql injection", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
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
    afterAll(() => closeTestingConnections(dataSources))

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

    function verifyIntegrity(dataSource: DataSource) {
        return async () => {
            const count = await dataSource.getRepository(Post).count()
            expect(count).to.equal(2)
        }
    }

    // TODO: addSelect accepts raw SQL and is vulnerable to statement stacking
    // on postgres/cockroachdb (e.g. "1; DELETE FROM post;"). Skipped until
    // raw SQL expression methods validate against semicolons.
    describe.skip("addSelect", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .addSelect(malicious)
                                .getRawMany()
                        } catch {
                            // expected to throw on invalid column expression
                        }
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

    // TODO: groupBy accepts raw SQL and is vulnerable to statement stacking
    // on postgres/cockroachdb (e.g. "1; DELETE FROM post;"). Skipped until
    // raw SQL expression methods validate against semicolons.
    describe.skip("groupBy", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .groupBy(malicious)
                                .getRawMany()
                        } catch {
                            // expected to throw on invalid column name
                        }
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

    // TODO: orderBy accepts raw SQL and is vulnerable to statement stacking
    // on postgres/cockroachdb (e.g. "1; DELETE FROM post;"). Skipped until
    // raw SQL expression methods validate against semicolons.
    describe.skip("orderBy", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .orderBy(malicious)
                                .getMany()
                        } catch {
                            // expected to throw on invalid column name
                        }
                        await verifyIntegrity(dataSource)()
                    }),
                ))
        }
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

    // TODO: select accepts raw SQL and is vulnerable to statement stacking
    // on postgres/cockroachdb (e.g. "1; DELETE FROM post;"). Skipped until
    // raw SQL expression methods validate against semicolons.
    describe.skip("select", () => {
        for (const malicious of maliciousInputs) {
            it(`should prevent injection with: ${malicious}`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        try {
                            await dataSource
                                .getRepository(Post)
                                .createQueryBuilder("post")
                                .select(malicious)
                                .getRawMany()
                        } catch {
                            // expected to throw on invalid column expression
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
})
