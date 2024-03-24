import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections, reloadTestingDatabases,
} from "../../utils/test-utils"
import {Column, DataSource, Entity, PrimaryGeneratedColumn} from "../../../src"
import {expect} from "chai"
import {Message} from "./entity/message";
import {MemoryLogger} from "../7662/memory-logger";

describe("github issues > #10056 Postgres vector type", () => {
    describe("vector extension", () => {
        it("should NOT be installed if option is disabled", async function () {
            let connection: DataSource | null = null
            try {
                const connections = await createTestingConnections({
                    entities: [`${__dirname}/entity/*{.js,.ts}`],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: true,
                    createLogger: () => new MemoryLogger(true),
                    driverSpecific: {
                        installExtensions: false,
                    },
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                connection = connections[0]

                const logger = connection.logger as MemoryLogger
                const createExtensionQueries = logger.queries.filter((q) =>
                    q.startsWith("CREATE EXTENSION IF NOT EXISTS"),
                )

                expect(createExtensionQueries).to.be.empty
            } finally {
                if (connection) {
                    const logger = connection.logger as MemoryLogger
                    logger.clear()
                    await closeTestingConnections([connection])
                }
            }
        })

        it("should be installed if option is undefined", async function () {
            let connections: DataSource[] = []
            try {
                connections = await createTestingConnections({
                    entities: [`${__dirname}/entity/*{.js,.ts}`],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: true,
                    createLogger: () => new MemoryLogger(true),
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                const connection = connections[0]

                const logger = connection.logger as MemoryLogger
                const createExtensionQueries = logger.queries.filter((q) =>
                    q === 'CREATE EXTENSION IF NOT EXISTS "vector"',
                )

                expect(createExtensionQueries).to.have.length(1)
            } finally {
                await closeTestingConnections(connections)
            }
        })
    })

    describe("vector type column", () => {
        @Entity({
            name: "message",
        })
        class Message1 {
            @PrimaryGeneratedColumn()
            id: number

            // create a vector embedding with 5 dimensions
            @Column("vector", { length: 5 })
            embedding: string;

            @Column({
                type: "text"
            })
            text: string
        }

        @Entity({
            name: "message",
        })
        class Message2WithDifferentColumn {
            @PrimaryGeneratedColumn()
            id: number

            // create a vector embedding with 5 dimensions
            @Column("vector", { length: 5 })
            embedding: string;

            @Column({
                type: "varchar"
            })
            text: string
        }

        @Entity({
            name: "message",
        })
        class Message3WithDifferentLength {
            @PrimaryGeneratedColumn()
            id: number

            // create a vector embedding with 3 dimensions
            @Column("vector", { length: 3 })
            embedding: string;

            @Column({
                type: "text"
            })
            text: string
        }

        it("should not be dropped or altered when any other column is modified", async function () {
            // let's first create Message1 and then modify it to be Message2WithDifferentColumn
            let connection: DataSource | null = null
            try {
                const connections = await createTestingConnections({
                    entities: [Message1],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: false,
                    createLogger: () => new MemoryLogger(true),
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                connection = connections[0]

                await connection.synchronize(true);
            } finally {
                if (connection) {
                    await closeTestingConnections([connection])
                }
            }

            try {
                const connections = await createTestingConnections({
                    entities: [Message2WithDifferentColumn],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: false,
                    createLogger: () => new MemoryLogger(true),
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                connection = connections[0]
                await connection.synchronize(false);

                const logger = connection.logger as MemoryLogger
                const queries = logger.queries

                expect(queries).to.include("ALTER TABLE \"message\" DROP COLUMN \"text\"")
                expect(queries).to.not.include("ALTER TABLE \"message\" DROP COLUMN \"embedding\"")
            } finally {
                if (connection) {
                    await closeTestingConnections([connection])
                }
            }
        })

        it("should be dropped and recreated when modified", async function () {
            // let's first create Message1 and then modify it to be Message3WithDifferentLength
            let connection: DataSource | null = null
            try {
                const connections = await createTestingConnections({
                    entities: [Message1],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: false,
                    createLogger: () => new MemoryLogger(true),
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                connection = connections[0]

                await connection.synchronize(true);
            } finally {
                if (connection) {
                    await closeTestingConnections([connection])
                }
            }

            try {
                const connections = await createTestingConnections({
                    entities: [Message3WithDifferentLength],
                    enabledDrivers: ["postgres"],
                    schemaCreate: false,
                    dropSchema: false,
                    createLogger: () => new MemoryLogger(true),
                })

                if (connections.length < 1) {
                    this.skip()
                    return
                }

                connection = connections[0]
                await connection.synchronize(false);

                const logger = connection.logger as MemoryLogger
                const queries = logger.queries

                // ALTER TABLE "message" DROP COLUMN "embedding" should exist
                expect(queries).to.include("ALTER TABLE \"message\" DROP COLUMN \"embedding\"")
                // ALTER TABLE "message" ADD COLUMN "embedding" should exist
                expect(queries).to.include(`ALTER TABLE "message" ADD "embedding" vector(3) NOT NULL`)
            } finally {
                if (connection) {
                    await closeTestingConnections([connection])
                }
            }
        })
    })

    describe("vector type values", () => {
        let dataSources: DataSource[]

        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: false,
                    dropSchema: true,
                    enabledDrivers: ["postgres"],
                    logging: true,
                })),
        )

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("has to create Message type with the vector column for embedding", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    dataSource.setOptions({
                        ...dataSource.options,
                        migrationsTransactionMode: "none",
                    })
                    const messageTable = await dataSource.query<{
                        columnName: string;
                        dataType: string;
                        udtName: string;
                        characterMaximumLength: number;
                    }[]>(
                        `
                            SELECT column_name              as "columnName",
                                   data_type                as "dataType",
                                   udt_name                 as "udtName"
                            FROM information_schema.columns
                            WHERE table_name = 'message'
                              AND column_name = 'embedding'`,
                    )
                    expect(messageTable).has.length(1)
                    expect(messageTable[0].dataType).to.be.eql("USER-DEFINED")
                    expect(messageTable[0].udtName).to.be.eql("vector")
                }),
            ))

        it("has to insert data with the correct vector column", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const em = dataSource.createEntityManager()
                    const message = em.create(Message, {
                        embedding: `[1,2,3,4,5]`,
                    })
                    await em.save(message)
                    const messageData = await em.findOne(Message, {
                        where: {
                            id: message.id,
                        },
                    })
                    expect(messageData).to.be.eql({
                        id: message.id,
                        embedding: `[1,2,3,4,5]`,
                    })
                }),
            ))

        it("has to produce an error if the vector length is not correct", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const em = dataSource.createEntityManager()
                    try {
                        await em.save(Message, {
                            embedding: `[1,2,3]`,
                        })
                        throw new Error("should not reach this point")
                    } catch (error) {
                        expect(error.message).to.be.eql(
                            "expected 5 dimensions, not 3",
                        )
                    }
                }),
            ))

        it("has to update data with the correct vector column", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const em = dataSource.createEntityManager()
                    const message = em.create(Message, {
                        embedding: `[1,2,3,4,5]`,
                    })
                    await em.save(message)
                    await em.update(Message, message.id, {
                        embedding: `[4,5,6,7,8]`,
                    })
                    const messageData = await em.findOne(Message, {
                        where: {
                            id: message.id,
                        },
                    })
                    expect(messageData).to.be.eql({
                        id: message.id,
                        embedding: `[4,5,6,7,8]`,
                    })
                }),
            ))

        it("has to produce an error if the updated vector length is not correct", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const em = dataSource.createEntityManager()
                    const message = em.create(Message, {
                        embedding: `[1,2,3,4,5]`,
                    })
                    await em.save(message)
                    try {
                        await em.update(Message, message.id, {
                            embedding: `[1,2,3]`,
                        })
                        throw new Error("should not reach this point")
                    } catch (error) {
                        expect(error.message).to.be.eql(
                            "expected 5 dimensions, not 3",
                        )
                    }
                }),
            ))

        // https://github.com/pgvector/pgvector-node/blob/d75481fedcd06db9a066d6daedacd04fed4ca175/tests/typeorm/index.test.mjs
        it("has to order by embedding similarity", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const em = dataSource.createEntityManager()
                    const message1 = await em.save(Message, {embedding: `[1,1,1,1,1]`})
                    const message2 = await em.save(Message, {embedding: `[2,2,2,2,2]`})
                    const message3 = await em.save(Message, {embedding: `[1,1,2,2,2]`})
                    const items = await em.createQueryBuilder(Message, "message")
                        .orderBy("embedding <-> :embedding")
                        .setParameters({embedding: `[1,1,1,1,1]`})
                        .limit(5)
                        .getMany()
                    expect(items.map(v => v.id)).to.be.eql([message1.id, message3.id, message2.id])
                    expect(items[0].embedding).to.be.eql(`[1,1,1,1,1]`)
                    expect(items[1].embedding).to.be.eql(`[1,1,2,2,2]`)
                    expect(items[2].embedding).to.be.eql(`[2,2,2,2,2]`)
                }),
            ))
    })
})
