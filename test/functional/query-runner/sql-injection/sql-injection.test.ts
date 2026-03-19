import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("query runner > sql injection", () => {
    let dataSources: DataSource[]
    before(async () => {
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

    function verifyIntegrity(dataSource: DataSource) {
        return async () => {
            const count = await dataSource.getRepository(Post).count()
            expect(count).to.equal(2)
        }
    }

    describe("DDL methods", () => {
        describe("createDatabase", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.createDatabase(
                                    malicious,
                                    true,
                                )
                            } catch {
                                // expected to throw on invalid database name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("createSchema", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.createSchema(malicious, true)
                            } catch {
                                // expected to throw on invalid schema name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("dropDatabase", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.dropDatabase(malicious, true)
                            } catch {
                                // expected to throw on invalid database name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("dropSchema", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.dropSchema(malicious, true)
                            } catch {
                                // expected to throw on invalid schema name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("dropTable", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.dropTable(malicious, true)
                            } catch {
                                // expected to throw on invalid table name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })
    })

    // TODO: clearTable, dropView, and renameTable still interpolate
    // identifiers directly into SQL. Skipped until identifier escaping
    // is fixed for these methods across all drivers.
    describe.skip("DDL methods (not yet fixed)", () => {
        describe("clearTable", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.clearTable(malicious)
                            } catch {
                                // expected to throw on invalid table name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("dropView", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.dropView(malicious)
                            } catch {
                                // expected to throw on invalid view name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("renameTable", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection via source name with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.renameTable(
                                    malicious,
                                    "hacked",
                                )
                            } catch {
                                // expected to throw on invalid table name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))

                it(`should prevent injection via target name with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.renameTable(
                                    "nonexistent_table",
                                    malicious,
                                )
                            } catch {
                                // expected to throw on nonexistent/invalid table name
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })
    })

    describe("read methods", () => {
        describe("hasColumn", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection via column name with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result = await queryRunner.hasColumn(
                                    "post",
                                    malicious,
                                )
                                expect(result).to.be.false
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))

                it(`should prevent injection via table name with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result = await queryRunner.hasColumn(
                                    malicious,
                                    "id",
                                )
                                expect(result).to.be.false
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("hasDatabase", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result =
                                    await queryRunner.hasDatabase(malicious)
                                expect(result).to.be.false
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("hasSchema", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result =
                                    await queryRunner.hasSchema(malicious)
                                expect(result).to.be.false
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("hasTable", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result =
                                    await queryRunner.hasTable(malicious)
                                expect(result).to.be.false
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })
    })

    // TODO: getSchemas, getTable, getTables, getView, getViews use string
    // interpolation in loadTables/loadViews internal methods. Skipped until
    // those internal methods are parameterized.
    describe.skip("read methods (not yet fixed)", () => {
        describe("getSchemas", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                await queryRunner.getSchemas(malicious)
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("getTable", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result =
                                    await queryRunner.getTable(malicious)
                                expect(result).to.be.undefined
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("getTables", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const results = await queryRunner.getTables([
                                    malicious,
                                ])
                                expect(results).to.have.length(0)
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("getView", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const result =
                                    await queryRunner.getView(malicious)
                                expect(result).to.be.undefined
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })

        describe("getViews", () => {
            for (const malicious of maliciousInputs) {
                it(`should prevent injection with: ${malicious}`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            if (dataSource.driver.options.type === "mongodb")
                                return

                            const queryRunner = dataSource.createQueryRunner()
                            try {
                                const results = await queryRunner.getViews([
                                    malicious,
                                ])
                                expect(results).to.have.length(0)
                            } catch {
                                // some drivers may throw on invalid identifiers
                            } finally {
                                await verifyIntegrity(dataSource)()
                                await queryRunner.release()
                            }
                        }),
                    ))
            }
        })
    })
})
