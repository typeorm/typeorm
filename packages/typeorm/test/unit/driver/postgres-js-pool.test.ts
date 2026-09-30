import { expect } from "chai"
import type { Readable } from "node:stream"

import type { PostgresConnectionCredentialsOptions } from "../../../src/driver/postgres/PostgresConnectionCredentialsOptions"
import type { PostgresJsDataSourceOptions } from "../../../src/driver/postgres/PostgresJsDataSourceOptions"
import type { PostgresJsConnection } from "../../../src/driver/postgres/PostgresJsPool"
import {
    buildPostgresJsOptions,
    type PostgresJsFactory,
    PostgresJsJsonParameter,
    PostgresJsPool,
    PostgresJsQueryStream,
} from "../../../src/driver/postgres/PostgresJsPool"

type Row = Record<string, unknown>

interface FakePending extends PromiseLike<Row[]> {
    cursor(batchSize?: number): AsyncIterable<Row[]>
}

interface FakeSql {
    unsafe(query: string, parameters?: unknown[]): FakePending
    reserve(): Promise<FakeSql>
    release(): void
    end(): Promise<void>
}

describe("PostgresJsPool", () => {
    const credentials: PostgresConnectionCredentialsOptions = {
        url: "postgres://user:pass@localhost:5432/db",
        host: "localhost",
        port: 5432,
        username: "user",
        password: "pass",
        database: "db",
        ssl: true,
        applicationName: "credential-app",
    }

    it("maps TypeORM credentials and options without losing zero timeouts", () => {
        const password = () => Promise.resolve("token")
        const mapped = buildPostgresJsOptions(
            options({
                poolSize: 7,
                connectTimeoutMS: 0,
                applicationName: "typeorm-app",
                extra: { prepare: false },
            }),
            { ...credentials, password },
        )

        expect(mapped.url).to.equal(credentials.url)
        expect(mapped.options).to.deep.include({
            host: "localhost",
            port: 5432,
            user: "user",
            database: "db",
            ssl: true,
            max: 7,
            connect_timeout: 0,
            prepare: false,
        })
        expect(mapped.options.password).to.equal(password)
        expect(mapped.options.connection).to.deep.equal({
            application_name: "typeorm-app",
        })
    })

    it("passes mapped values and native extras to the adapter factory", () => {
        const fake = createFake()
        new PostgresJsPool(
            fake.factory,
            options({
                poolSize: 4,
                connectTimeoutMS: 1500,
                applicationName: "factory-app",
                extra: { prepare: false, max_lifetime: 120 },
            }),
            credentials,
        )

        expect(fake.factoryCalls).to.have.length(1)
        expect(fake.factoryCalls[0][0]).to.equal(credentials.url)
        expect(fake.factoryCalls[0][1]).to.deep.include({
            max: 4,
            connect_timeout: 1.5,
            prepare: false,
            max_lifetime: 120,
        })
        expect(
            (fake.factoryCalls[0][1] as Record<string, unknown>).connection,
        ).to.deep.equal({ application_name: "factory-app" })
    })

    it("translates pg aliases and gives native Postgres.js keys precedence", () => {
        const aliased = buildPostgresJsOptions(
            options({
                extra: {
                    connectionTimeoutMillis: 2500,
                    idleTimeoutMillis: 5000,
                    application_name: "pg-app",
                },
            }),
            {},
        )
        expect(aliased.options.connect_timeout).to.equal(2.5)
        expect(aliased.options.idle_timeout).to.equal(5)
        expect(aliased.options.connection).to.deep.equal({
            application_name: "pg-app",
        })
        expect(aliased.options).not.to.have.keys(
            "connectionTimeoutMillis",
            "idleTimeoutMillis",
            "application_name",
        )

        const native = buildPostgresJsOptions(
            options({
                extra: {
                    connectionTimeoutMillis: 2500,
                    connect_timeout: 9,
                    idleTimeoutMillis: 5000,
                    idle_timeout: 8,
                    application_name: "pg-app",
                    connection: { application_name: "native-app" },
                },
            }),
            {},
        )
        expect(native.options.connect_timeout).to.equal(9)
        expect(native.options.idle_timeout).to.equal(8)
        expect(native.options.connection).to.deep.equal({
            application_name: "native-app",
        })
    })

    it("reports known pg-only options and passes unknown native options", () => {
        const warnings: string[] = []
        const mapped = buildPostgresJsOptions(
            options({
                extra: {
                    allowExitOnIdle: true,
                    maxUses: 10,
                    query_timeout: 1000,
                    future_postgres_js_option: "kept",
                },
            }),
            {},
            { onWarning: (message) => warnings.push(message) },
        )

        expect(warnings).to.have.length(3)
        expect(warnings.join("\n")).to.include('"allowExitOnIdle"')
        expect(warnings.join("\n")).to.include('"maxUses"')
        expect(warnings.join("\n")).to.include('"query_timeout"')
        expect(mapped.options.future_postgres_js_option).to.equal("kept")
        expect(mapped.options).not.to.have.keys(
            "allowExitOnIdle",
            "maxUses",
            "query_timeout",
        )
    })

    it("parses int8 only when lossless and preserves native type overrides", () => {
        const mapped = buildPostgresJsOptions(options({ parseInt8: true }), {})
        const types = mapped.options.types as Record<
            string,
            { parse: (raw: string) => unknown }
        >
        expect(types.typeormInt8.parse("42")).to.equal(42)
        expect(types.typeormInt8.parse("9007199254740992")).to.equal(
            "9007199254740992",
        )

        const custom = {
            to: 20,
            from: [20],
            serialize: String,
            parse: (raw: string) => `custom:${raw}`,
        }
        const native = buildPostgresJsOptions(
            options({ parseInt8: true, extra: { types: { custom } } }),
            {},
        )
        expect(native.options.types).to.have.property("custom", custom)
        expect(native.options.types).not.to.have.property("typeormInt8")
        expect(native.options.types).to.have.keys(
            "custom",
            "typeormDate",
            "typeormInterval",
            "typeormPoint",
            "typeormCircle",
        )
    })

    it("chains a user notice callback with the adapter callback", () => {
        const calls: string[] = []
        const mapped = buildPostgresJsOptions(
            options({
                extra: {
                    onnotice: () => calls.push("user"),
                },
            }),
            {},
            { onNotice: () => calls.push("adapter") },
        )

        const onnotice = mapped.options.onnotice
        expect(onnotice).to.be.a("function")
        if (typeof onnotice === "function") onnotice({ message: "notice" })
        expect(calls).to.deep.equal(["user", "adapter"])
    })

    it("chains a user notification callback with the adapter callback", () => {
        const calls: string[] = []
        const mapped = buildPostgresJsOptions(
            options({
                extra: {
                    onnotify: (channel: string, payload: string) =>
                        calls.push(`user:${channel}:${payload}`),
                },
            }),
            {},
            {
                onNotification: (channel, payload) =>
                    calls.push(`adapter:${channel}:${payload}`),
            },
        )

        const onnotify = mapped.options.onnotify
        expect(onnotify).to.be.a("function")
        if (typeof onnotify === "function") onnotify("events", "ready")
        expect(calls).to.deep.equal([
            "user:events:ready",
            "adapter:events:ready",
        ])
    })

    it("uses unsafe parameters unchanged and normalizes command results", async () => {
        const fake = createFake()
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection, release } = await connect(pool)
        const parameters = ["Robert'); DROP TABLE users;--"]

        for (const command of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
            fake.setPending(result([{ command }], 3, command))
            const normalized = await connection.query(
                `/* ${command} */ SELECT $1`,
                parameters,
            )
            const call = fake.unsafeCalls.at(-1)

            expect(call?.query).to.equal(`/* ${command} */ SELECT $1`)
            expect(call?.query).not.to.include(parameters[0])
            expect(call?.parameters).to.equal(parameters)
            expect(normalized).to.deep.equal({
                rows: [{ command }],
                rowCount: 3,
                command,
            })
        }

        release()
        release()
        expect(fake.reserveCount()).to.equal(1)
        expect(fake.releaseCount()).to.equal(1)
    })

    it("encodes arrays and JSON without relying on stale inferred codecs", async () => {
        const fake = createFake()
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection } = await connect(pool)

        await connection.query("SELECT $1, $2, $3", [
            ['quoted"value', "back\\slash", null, [1, 2]],
            JSON.stringify({ fromRawSql: true }),
            new PostgresJsJsonParameter("42"),
        ])

        const parameters = fake.unsafeCalls.at(-1)?.parameters
        expect(parameters?.[0]).to.equal(
            '{"quoted\\"value","back\\\\slash",NULL,{"1","2"}}',
        )
        expect(String(parameters?.[1])).to.equal('{"fromRawSql":true}')
        expect(JSON.stringify(parameters?.[1])).to.equal('{"fromRawSql":true}')
        expect(JSON.stringify(parameters?.[2])).to.equal('"42"')

        await connection.query("SELECT $1", [undefined])
        expect(fake.unsafeCalls.at(-1)?.parameters).to.deep.equal([null])
    })

    it("supports pg-style query callbacks", async () => {
        const fake = createFake()
        fake.setPending(result([{ value: 1 }], 1, "SELECT"))
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection } = await connect(pool)

        const normalized = await new Promise((resolve, reject) => {
            connection.query("SELECT 1", (error, queryResult) => {
                if (error) reject(error)
                else resolve(queryResult)
            })
        })

        expect(normalized).to.deep.equal({
            rows: [{ value: 1 }],
            rowCount: 1,
            command: "SELECT",
        })
    })

    it("propagates query errors unchanged", async () => {
        const fake = createFake()
        const failure = new Error("query failed")
        fake.setPending(rejected(failure))
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection } = await connect(pool)

        let caught: unknown
        try {
            await connection.query("broken")
        } catch (error) {
            caught = error
        }
        expect(caught).to.equal(failure)
    })

    it("serializes concurrent work on one reserved connection", async () => {
        const fake = createFake()
        let finishFirst: ((rows: Row[]) => void) | undefined
        const first = new Promise<Row[]>((resolve) => {
            finishFirst = resolve
        })
        fake.setPending(
            Object.assign(first, {
                cursor: async function* () {
                    yield await first
                },
            }),
        )
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection } = await connect(pool)

        const firstQuery = connection.query("SELECT 1")
        await Promise.resolve()
        fake.setPending(result([{ value: 2 }], 1, "SELECT"))
        const secondQuery = connection.query("SELECT 2")

        expect(fake.unsafeCalls.map((call) => call.query)).to.deep.equal([
            "SELECT 1",
        ])
        finishFirst?.(result([{ value: 1 }], 1, "SELECT"))
        expect((await firstQuery).rows).to.deep.equal([{ value: 1 }])
        expect((await secondQuery).rows).to.deep.equal([{ value: 2 }])
        expect(fake.unsafeCalls.map((call) => call.query)).to.deep.equal([
            "SELECT 1",
            "SELECT 2",
        ])
    })

    it("awaits shutdown and invokes the underlying end only once", async () => {
        let finishEnd: (() => void) | undefined
        const endGate = new Promise<void>((resolve) => {
            finishEnd = resolve
        })
        const fake = createFake(endGate)
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        let settled = false

        const ending = pool.end().then(() => {
            settled = true
        })
        await Promise.resolve()
        expect(settled).to.equal(false)
        finishEnd?.()
        await ending
        await pool.end()

        expect(settled).to.equal(true)
        expect(fake.endCount()).to.equal(1)
    })

    it("streams cursor batches in order and preserves cursor errors", async () => {
        const fake = createFake()
        let requestedBatchSize: number | undefined
        fake.setPending(
            pending(result([], 0, "SELECT"), async function* (batchSize) {
                await Promise.resolve()
                requestedBatchSize = batchSize
                yield [{ id: 1 }, { id: 2 }]
                yield [{ id: 3 }]
            }),
        )
        const pool = new PostgresJsPool(fake.factory, options(), credentials)
        const { connection } = await connect(pool)
        const stream = connection.query(
            new PostgresJsQueryStream("SELECT id", [], 2),
        )

        expect(stream.readableObjectMode).to.equal(true)
        expect(stream.readableHighWaterMark).to.equal(1)
        expect(await collect(stream)).to.deep.equal([
            { id: 1 },
            { id: 2 },
            { id: 3 },
        ])
        expect(requestedBatchSize).to.equal(2)

        const cursorFailure = new Error("cursor failed")
        fake.setPending(
            pending(result([], 0, "SELECT"), async function* () {
                await Promise.resolve()
                yield [{ id: 1 }]
                throw cursorFailure
            }),
        )
        const failingStream = connection.query(
            new PostgresJsQueryStream("SELECT broken"),
        )
        let caught: unknown
        try {
            await collect(failingStream)
        } catch (error) {
            caught = error
        }
        expect(caught).to.equal(cursorFailure)
    })
})

function options(
    overrides: Partial<PostgresJsDataSourceOptions> = {},
): PostgresJsDataSourceOptions {
    return { type: "postgres-js", ...overrides }
}

function result(rows: Row[], count: number, command: string): Row[] {
    return Object.assign(rows, { count, command })
}

function pending(
    rows: Row[],
    cursor: (batchSize?: number) => AsyncIterable<Row[]> = async function* () {
        await Promise.resolve()
        yield rows
    },
): FakePending {
    return Object.assign(Promise.resolve(rows), { cursor })
}

function rejected(error: Error): FakePending {
    const promise = Promise.reject(error)
    void promise.catch(() => undefined)
    return Object.assign(promise, {
        cursor: () => ({
            [Symbol.asyncIterator]() {
                return {
                    next: () => Promise.reject(error),
                }
            },
        }),
    })
}

function createFake(endPromise: Promise<void> = Promise.resolve()) {
    let currentPending = pending(result([], 0, "SELECT"))
    let reserves = 0
    let releases = 0
    let ends = 0
    const unsafeCalls: Array<{ query: string; parameters?: unknown[] }> = []

    const sql: FakeSql = {
        unsafe(query, parameters) {
            unsafeCalls.push({ query, parameters })
            return currentPending
        },
        reserve() {
            reserves += 1
            return Promise.resolve(sql)
        },
        release() {
            releases += 1
        },
        end() {
            ends += 1
            return endPromise
        },
    }
    const factoryCalls: unknown[][] = []
    const factory = ((...args: unknown[]) => {
        factoryCalls.push(args)
        return sql
    }) as unknown as PostgresJsFactory

    return {
        factory,
        factoryCalls,
        unsafeCalls,
        setPending(value: FakePending | Row[]) {
            currentPending = "cursor" in value ? value : pending(value)
        },
        reserveCount: () => reserves,
        releaseCount: () => releases,
        endCount: () => ends,
    }
}

function connect(pool: PostgresJsPool): Promise<{
    connection: PostgresJsConnection
    release: (error?: unknown) => void
}> {
    return new Promise((resolve, reject) => {
        pool.connect((error, connection, release) => {
            if (error) return reject(error)
            if (!connection || !release)
                return reject(new Error("connection was not returned"))
            resolve({ connection, release })
        })
    })
}

async function collect(stream: Readable): Promise<unknown[]> {
    const rows: unknown[] = []
    for await (const row of stream) rows.push(row)
    return rows
}
