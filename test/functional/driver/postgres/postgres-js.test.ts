import "reflect-metadata"

import { expect } from "chai"
import postgres from "postgres"
import sinon from "sinon"

import type {
    DataSourceOptions,
    EntitySubscriberInterface,
    Logger,
    MigrationInterface,
    QueryRunner,
} from "../../../../src"
import {
    DataSource,
    EntitySchema,
    EventSubscriber,
    QueryFailedError,
} from "../../../../src"
import type { PostgresJsDataSourceOptions } from "../../../../src/driver/postgres/PostgresJsDataSourceOptions"
import { PostgresDriver } from "../../../../src/driver/postgres/PostgresDriver"
import type { PostgresConnectionCredentialsOptions } from "../../../../src/driver/postgres/PostgresConnectionCredentialsOptions"
import type { PostgresJsFactory } from "../../../../src/driver/postgres/PostgresJsPool"
import { PlatformTools } from "../../../../src/platform/PlatformTools"
import { setupSingleTestingConnection } from "../../../utils/test-utils"

interface PortableRow {
    id: number
    value: string
}

const PortableEntity = new EntitySchema<PortableRow>({
    name: "PostgresJsPortableRow",
    tableName: "postgres_js_portable_row",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        value: {
            type: String,
        },
    },
})

class SharedMigration1784413000000 implements MigrationInterface {
    async up(_queryRunner: QueryRunner): Promise<void> {}

    async down(_queryRunner: QueryRunner): Promise<void> {}
}

let subscriberInsertCount = 0

@EventSubscriber()
class SharedSubscriber implements EntitySubscriberInterface {
    afterInsert(): void {
        subscriberInsertCount += 1
    }
}

describe("driver > postgres > Postgres.js", () => {
    let variants: [DataSourceOptions, DataSourceOptions]

    before(function () {
        const configured = setupSingleTestingConnection("postgres-js", {}) as
            PostgresJsDataSourceOptions | undefined
        if (!configured) return this.skip()

        const { type, driver, ...configuredPortable } = configured
        void type
        void driver
        const entities = [PortableEntity]
        const migrations = [SharedMigration1784413000000]
        const subscribers = [SharedSubscriber]
        const portable = {
            ...configuredPortable,
            dropSchema: true,
            synchronize: true,
            entities,
            migrations,
            subscribers,
        }

        variants = [
            { ...portable, type: "postgres" },
            { ...portable, type: "postgres-js" },
        ]
    })

    it("initializes the shared driver and synchronizes entity metadata", async () => {
        await forEachClient(variants, async (dataSource) => {
            expect(dataSource.driver).to.be.instanceOf(PostgresDriver)
            const driver = dataSource.driver as PostgresDriver
            expect(driver.version).to.match(/^\d+/)
            expect(driver.database).to.be.a("string").and.not.empty
            expect(driver.schema).to.equal("public")
            expect(dataSource.hasMetadata(PortableEntity)).to.equal(true)

            const queryRunner = dataSource.createQueryRunner()
            expect(
                await queryRunner.hasTable("postgres_js_portable_row"),
            ).to.equal(true)
            await queryRunner.release()
        })
    })

    it("preserves parameters and affected counts for CRUD", async () => {
        await forEachClient(variants, async (dataSource) => {
            const repository = dataSource.getRepository(PortableEntity)
            const injection = "Robert'); DROP TABLE users;--"
            const inserted = await repository.insert({ value: injection })
            const id = inserted.identifiers[0].id as number

            expect(await repository.findOneByOrFail({ id })).to.include({
                id,
                value: injection,
            })

            const updated = await repository.update(id, { value: "updated" })
            expect(updated.affected).to.equal(1)
            expect((await repository.findOneByOrFail({ id })).value).to.equal(
                "updated",
            )

            const deleted = await repository.delete(id)
            expect(deleted.affected).to.equal(1)
            expect(await repository.findOneBy({ id })).to.equal(null)
        })
    })

    it("commits, rolls back, and preserves Postgres.js error fields", async () => {
        await forEachClient(variants, async (dataSource) => {
            const repository = dataSource.getRepository(PortableEntity)
            let transactionBackend: number | undefined

            await dataSource.transaction(async (manager) => {
                const first = await manager.query(
                    "SELECT pg_backend_pid() AS pid",
                )
                const second = await manager.query(
                    "SELECT pg_backend_pid() AS pid",
                )
                expect(second[0].pid).to.equal(first[0].pid)
                transactionBackend = first[0].pid
                await manager.insert(PortableEntity, { value: "committed" })
            })
            expect(transactionBackend).to.be.a("number")
            expect(await repository.countBy({ value: "committed" })).to.equal(1)

            const rollback = new Error("rollback sentinel")
            let rolledBack: unknown
            try {
                await dataSource.transaction(async (manager) => {
                    await manager.insert(PortableEntity, {
                        value: "rolled-back",
                    })
                    throw rollback
                })
            } catch (error) {
                rolledBack = error
            }
            expect(rolledBack).to.equal(rollback)
            expect(await repository.countBy({ value: "rolled-back" })).to.equal(
                0,
            )

            const query =
                'SELECT * FROM "postgres_js_missing_table" WHERE "id" = $1'
            const parameters = [731]
            let caught: unknown
            try {
                await dataSource.query(query, parameters)
            } catch (error) {
                caught = error
            }
            expect(caught).to.be.instanceOf(QueryFailedError)
            const failure = caught as QueryFailedError & { code?: string }
            expect(failure.query).to.equal(query)
            expect(failure.parameters).to.equal(parameters)
            expect(failure.driverError).to.have.property("code", "42P01")
            expect(failure.code).to.equal("42P01")
        })
    })

    it("changes only type while reusing configuration and application code", async () => {
        const [
            { type: pgType, ...pg },
            { type: postgresJsType, ...postgresJs },
        ] = variants
        expect(pgType).to.equal("postgres")
        expect(postgresJsType).to.equal("postgres-js")
        expect(pg).to.deep.equal(postgresJs)
        expect(pg.entities).to.equal(postgresJs.entities)
        expect(pg.migrations).to.equal(postgresJs.migrations)
        expect(pg.subscribers).to.equal(postgresJs.subscribers)

        await forEachClient(variants, async (dataSource) => {
            subscriberInsertCount = 0
            expect(dataSource.entityMetadatas).to.have.length(1)
            expect(dataSource.migrations).to.have.length(1)
            expect(dataSource.subscribers).to.have.length(1)
            await runPortableApplication(dataSource)
            expect(subscriberInsertCount).to.be.greaterThan(0)
        })
    })
})

describe("driver > postgres > Postgres.js advanced behavior", () => {
    let configured: PostgresJsDataSourceOptions

    before(function () {
        const options = setupSingleTestingConnection("postgres-js", {}) as
            PostgresJsDataSourceOptions | undefined
        if (!options) return this.skip()
        configured = options
    })

    it("keeps int8 lossless without changing numeric parsing", async () => {
        for (const parseInt8 of [false, true]) {
            const dataSource = new DataSource({
                ...configured,
                type: "postgres-js",
                installExtensions: false,
                parseInt8,
            })
            try {
                await dataSource.initialize()
                const [row] = await dataSource.query(
                    "SELECT 42::int8 AS safe, " +
                        "9007199254740992::int8 AS unsafe, " +
                        "1.23456789::numeric AS decimal",
                )
                expect(row.safe).to.equal(parseInt8 ? 42 : "42")
                expect(row.unsafe).to.equal("9007199254740992")
                expect(row.decimal).to.equal("1.23456789")
            } finally {
                if (dataSource.isInitialized) await dataSource.destroy()
            }
        }
    })

    it("streams ordered rows, propagates cursor errors, and releases", async () => {
        const dataSource = new DataSource({
            ...configured,
            type: "postgres-js",
            installExtensions: false,
            dropSchema: true,
            synchronize: true,
            entities: [PortableEntity],
        })
        await dataSource.initialize()
        const queryRunner = dataSource.createQueryRunner()
        const load = sinon.stub(PlatformTools, "load")
        try {
            await dataSource
                .getRepository(PortableEntity)
                .insert([
                    { value: "a" },
                    { value: "b" },
                    { value: "c" },
                    { value: "d" },
                ])
            const stream = await queryRunner.stream(
                'SELECT "value" FROM "postgres_js_portable_row" ORDER BY "id"',
            )
            expect(await collectStream(stream)).to.deep.equal([
                { value: "a" },
                { value: "b" },
                { value: "c" },
                { value: "d" },
            ])
            expect(load.neverCalledWith("pg-query-stream")).to.equal(true)

            const failing = await queryRunner.stream(
                'SELECT * FROM "postgres_js_missing_stream_table"',
            )
            let caught: unknown
            try {
                await collectStream(failing)
            } catch (error) {
                caught = error
            }
            expect(caught).to.have.property("code", "42P01")
        } finally {
            load.restore()
            await queryRunner.release()
            expect(
                (dataSource.driver as PostgresDriver).connectedQueryRunners,
            ).to.have.length(0)
            await dataSource.destroy()
        }
    })

    it("routes replication pools with independent application names", async () => {
        const credentials = getCredentials(configured)
        const dataSource = new DataSource({
            ...configured,
            type: "postgres-js",
            applicationName: undefined,
            installExtensions: false,
            dropSchema: true,
            synchronize: true,
            entities: [PortableEntity],
            replication: {
                defaultMode: "slave",
                master: {
                    ...credentials,
                    applicationName: "postgres-js-master",
                },
                slaves: [
                    {
                        ...credentials,
                        applicationName: "postgres-js-slave",
                    },
                ],
            },
        })
        try {
            await dataSource.initialize()
            const driver = dataSource.driver as PostgresDriver
            expect(driver.master).not.to.equal(driver.slaves[0])

            const master = dataSource.createQueryRunner("master")
            const slave = dataSource.createQueryRunner("slave")
            expect(await applicationName(master)).to.equal("postgres-js-master")
            expect(await applicationName(slave)).to.equal("postgres-js-slave")
            await master.release()
            await slave.release()

            const written = await dataSource
                .createQueryBuilder()
                .insert()
                .into(PortableEntity)
                .values({
                    value: () => "current_setting('application_name')",
                })
                .returning("value")
                .execute()
            expect(written.raw[0].value).to.equal("postgres-js-master")

            const read = await dataSource.manager
                .createQueryBuilder(PortableEntity, "row")
                .select(
                    "current_setting('application_name')",
                    "application_name",
                )
                .getRawOne()
            expect(read.application_name).to.equal("postgres-js-slave")
        } finally {
            if (dataSource.isInitialized) await dataSource.destroy()
        }
    })

    it("logs native notices and notifications once only when enabled", async () => {
        const enabled = await exerciseNotifications(configured, true)
        expect(enabled.noticeCallbacks).to.equal(1)
        expect(enabled.notificationCallbacks).to.equal(1)
        expect(enabled.noticeLogs).to.equal(1)
        expect(enabled.notificationLogs).to.equal(1)

        const disabled = await exerciseNotifications(configured, false)
        expect(disabled.noticeCallbacks).to.equal(1)
        expect(disabled.notificationCallbacks).to.equal(1)
        expect(disabled.noticeLogs).to.equal(0)
        expect(disabled.notificationLogs).to.equal(0)
    })

    it("serializes concurrent transaction work on one QueryRunner", async () => {
        const dataSource = new DataSource({
            ...configured,
            type: "postgres-js",
            installExtensions: false,
            dropSchema: true,
            synchronize: true,
            entities: [PortableEntity],
        })
        const queryRunner = dataSource.createQueryRunner()
        try {
            await dataSource.initialize()
            await queryRunner.startTransaction()
            await Promise.all(
                Array.from({ length: 12 }, (_, index) =>
                    queryRunner.query(
                        'INSERT INTO "postgres_js_portable_row" ("value") VALUES ($1)',
                        [`queued-${String(index).padStart(2, "0")}`],
                    ),
                ),
            )
            await queryRunner.commitTransaction()
            const rows = await queryRunner.query(
                'SELECT "value" FROM "postgres_js_portable_row" ORDER BY "id"',
            )
            expect(rows.map((row: PortableRow) => row.value)).to.deep.equal(
                Array.from(
                    { length: 12 },
                    (_, index) => `queued-${String(index).padStart(2, "0")}`,
                ),
            )
        } finally {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction()
            }
            await queryRunner.release()
            if (dataSource.isInitialized) await dataSource.destroy()
        }
    })

    it("repeats lifecycle teardown and rejects post-end queries", async () => {
        for (let cycle = 0; cycle < 3; cycle += 1) {
            const lifecycle = instrumentPostgresJs()
            const credentials = getCredentials(configured)
            const dataSource = new DataSource({
                ...configured,
                type: "postgres-js",
                driver: lifecycle.factory,
                applicationName: undefined,
                installExtensions: false,
                replication: {
                    master: {
                        ...credentials,
                        applicationName: `lifecycle-master-${cycle}`,
                    },
                    slaves: [
                        {
                            ...credentials,
                            applicationName: `lifecycle-slave-${cycle}`,
                        },
                    ],
                },
            })
            await dataSource.initialize()
            const driver = dataSource.driver as PostgresDriver
            const master = dataSource.createQueryRunner("master")
            const slave = dataSource.createQueryRunner("slave")
            await master.query("SELECT 1")
            await slave.query("SELECT 1")
            expect(driver.connectedQueryRunners).to.have.length(2)

            await dataSource.destroy()

            expect(driver.connectedQueryRunners).to.have.length(0)
            expect(lifecycle.counters).to.have.length(2)
            for (const counter of lifecycle.counters) {
                expect(counter.releases).to.equal(counter.reserves)
                expect(counter.ends).to.equal(1)
                expect(counter.ended).to.equal(true)
            }

            let postEndError: unknown
            try {
                await driver.master.query("SELECT 1")
            } catch (error) {
                postEndError = error
            }
            expect(postEndError).to.be.instanceOf(Error)
        }
    })
})

async function forEachClient(
    variants: [DataSourceOptions, DataSourceOptions],
    assertion: (dataSource: DataSource) => Promise<void>,
): Promise<void> {
    for (const options of variants) {
        const dataSource = new DataSource(options)
        try {
            await dataSource.initialize()
            await assertion(dataSource)
        } finally {
            if (dataSource.isInitialized) await dataSource.destroy()
        }
    }
}

async function runPortableApplication(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(PortableEntity)
    const saved = await repository.save({ value: "portable" })
    expect((await repository.findOneByOrFail({ id: saved.id })).value).to.equal(
        "portable",
    )
    await dataSource.transaction(async (manager) => {
        await manager.update(PortableEntity, saved.id, { value: "transaction" })
    })
    expect((await repository.findOneByOrFail({ id: saved.id })).value).to.equal(
        "transaction",
    )
}

async function applicationName(queryRunner: QueryRunner): Promise<string> {
    const [row] = await queryRunner.query(
        "SELECT current_setting('application_name') AS application_name",
    )
    return row.application_name
}

function getCredentials(
    options: PostgresJsDataSourceOptions,
): PostgresConnectionCredentialsOptions {
    return {
        url: options.url,
        host: options.host,
        port: options.port,
        username: options.username,
        password: options.password,
        database: options.database,
        ssl: options.ssl,
    }
}

class RecordingLogger implements Logger {
    readonly entries: Array<{ level: string; message: unknown }> = []

    logQuery(): void {}

    logQueryError(): void {}

    logQuerySlow(): void {}

    logSchemaBuild(): void {}

    logMigration(): void {}

    log(level: "log" | "info" | "warn", message: unknown): void {
        this.entries.push({ level, message })
    }
}

async function exerciseNotifications(
    configured: PostgresJsDataSourceOptions,
    logNotifications: boolean,
): Promise<{
    noticeCallbacks: number
    notificationCallbacks: number
    noticeLogs: number
    notificationLogs: number
}> {
    const logger = new RecordingLogger()
    let noticeCallbacks = 0
    let notificationCallbacks = 0
    let resolveNotice: (() => void) | undefined
    let resolveNotification: (() => void) | undefined
    const notice = new Promise<void>((resolve) => {
        resolveNotice = resolve
    })
    const notification = new Promise<void>((resolve) => {
        resolveNotification = resolve
    })
    const dataSource = new DataSource({
        ...configured,
        type: "postgres-js",
        installExtensions: false,
        logNotifications,
        logger,
        extra: {
            ...(configured.extra ?? {}),
            onnotice: () => {
                noticeCallbacks += 1
                resolveNotice?.()
            },
            onnotify: () => {
                notificationCallbacks += 1
                resolveNotification?.()
            },
        },
    })
    const queryRunner = dataSource.createQueryRunner()
    try {
        await dataSource.initialize()
        await queryRunner.query("LISTEN typeorm_postgres_js_events")
        await queryRunner.query(
            "DO $do$ BEGIN RAISE NOTICE 'postgres-js-notice'; END $do$",
        )
        await withTimeout(notice)
        await queryRunner.query(
            "NOTIFY typeorm_postgres_js_events, 'postgres-js-payload'",
        )
        await withTimeout(notification)
        await queryRunner.query("UNLISTEN typeorm_postgres_js_events")
    } finally {
        await queryRunner.release()
        if (dataSource.isInitialized) await dataSource.destroy()
    }

    return {
        noticeCallbacks,
        notificationCallbacks,
        noticeLogs: logger.entries.filter(
            (entry) =>
                entry.level === "info" &&
                entry.message === "postgres-js-notice",
        ).length,
        notificationLogs: logger.entries.filter(
            (entry) =>
                entry.level === "info" &&
                entry.message ===
                    "Received NOTIFY on channel typeorm_postgres_js_events: postgres-js-payload.",
        ).length,
    }
}

async function withTimeout(promise: Promise<void>): Promise<void> {
    let timeout: NodeJS.Timeout | undefined
    try {
        await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error("notification timeout")),
                    2000,
                )
            }),
        ])
    } finally {
        if (timeout) clearTimeout(timeout)
    }
}

async function collectStream(
    stream: AsyncIterable<unknown>,
): Promise<unknown[]> {
    const rows: unknown[] = []
    for await (const row of stream) rows.push(row)
    return rows
}

interface LifecycleCounter {
    reserves: number
    releases: number
    ends: number
    ended: boolean
}

function instrumentPostgresJs(): {
    factory: typeof postgres
    counters: LifecycleCounter[]
} {
    const native = postgres as unknown as PostgresJsFactory
    const counters: LifecycleCounter[] = []
    const factory = ((
        first?: string | Record<string, unknown>,
        second?: Record<string, unknown>,
    ) => {
        const sql =
            typeof first === "string"
                ? native(first, second)
                : native(first ?? {})
        const counter: LifecycleCounter = {
            reserves: 0,
            releases: 0,
            ends: 0,
            ended: false,
        }
        counters.push(counter)

        return new Proxy(sql, {
            get(target, property) {
                if (property === "reserve") {
                    return async () => {
                        counter.reserves += 1
                        const reserved = await target.reserve()
                        return new Proxy(reserved, {
                            get(reservedTarget, reservedProperty) {
                                if (reservedProperty === "release") {
                                    return () => {
                                        counter.releases += 1
                                        reservedTarget.release()
                                    }
                                }
                                const value = Reflect.get(
                                    reservedTarget,
                                    reservedProperty,
                                    reservedTarget,
                                )
                                return typeof value === "function"
                                    ? value.bind(reservedTarget)
                                    : value
                            },
                        })
                    }
                }
                if (property === "end") {
                    return async () => {
                        counter.ends += 1
                        await target.end()
                        counter.ended = true
                    }
                }
                const value = Reflect.get(target, property, target)
                return typeof value === "function" ? value.bind(target) : value
            },
        })
    }) as unknown as typeof postgres

    return { factory, counters }
}
