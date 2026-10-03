import { expect } from "chai"
import sinon from "sinon"
import { EventEmitter } from "events"
import { PassThrough } from "stream"
import type { ReadStream } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PgDriverAdapter } from "../../../src/driver/postgres/PgDriverAdapter"
import type {
    PostgresDriverAdapter,
    PostgresConnectionRelease,
} from "../../../src/driver/postgres/PostgresDriverAdapter"
import type { PostgresConnectionCredentialsOptions } from "../../../src/driver/postgres/PostgresConnectionCredentialsOptions"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { QueryResult } from "../../../src/query-runner/QueryResult"
import { QueryFailedError } from "../../../src/error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../../src/error/QueryRunnerAlreadyReleasedError"
import type { AfterQueryEvent } from "../../../src/subscriber/event/QueryEvent"

interface Pool {
    host?: string
    closed: boolean
}
interface Connection {
    pool: Pool
    released: boolean
    error?: (error: Error) => void
}
interface NativeResult {
    values: unknown[]
    changed: number
    kind: string
}

class TestAdapter implements PostgresDriverAdapter {
    pools: Pool[] = []
    connections: Connection[] = []
    queries: { connection: unknown; sql: string; parameters?: unknown[] }[] = []
    releaseErrors: (Error | undefined)[] = []
    createPool(
        _options: PostgresDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
    ): Promise<unknown> {
        const pool = { host: credentials.host, closed: false }
        this.pools.push(pool)
        return Promise.resolve(pool)
    }
    closePool(pool: unknown): Promise<void> {
        ;(pool as Pool).closed = true
        return Promise.resolve()
    }
    acquire(pool: unknown): Promise<[unknown, PostgresConnectionRelease]> {
        const connection: Connection = { pool: pool as Pool, released: false }
        this.connections.push(connection)
        return Promise.resolve([
            connection,
            (error?: Error) => {
                connection.released = true
                this.releaseErrors.push(error)
                return Promise.resolve()
            },
        ])
    }
    query(
        connection: unknown,
        sql: string,
        parameters?: unknown[],
    ): Promise<unknown> {
        this.queries.push({ connection, sql, parameters })
        return Promise.resolve({
            values: [
                {
                    version: "PostgreSQL 17.0",
                    current_database: "test",
                    current_schema: "public",
                },
            ],
            changed: 1,
            kind: "SELECT",
        })
    }
    normalizeResult(raw: unknown): QueryResult {
        const native = raw as NativeResult
        const result = new QueryResult()
        result.records = native.values
        result.affected = native.changed
        result.raw =
            native.kind === "UPDATE" || native.kind === "DELETE"
                ? [native.values, native.changed]
                : native.values
        return result
    }
    onError(connection: unknown, listener: (error: Error) => void): () => void {
        const native = connection as Connection
        native.error = listener
        return () => {
            native.error = undefined
        }
    }
}

async function rejects(
    promise: Promise<unknown>,
    expected: unknown,
): Promise<void> {
    let error: unknown
    try {
        await promise
    } catch (caught) {
        error = caught
    }
    if (typeof expected === "function") expect(error).to.be.instanceOf(expected)
    else expect(error).to.equal(expected)
}

function source(
    adapter: PostgresDriverAdapter,
    options: Partial<PostgresDataSourceOptions> = {},
) {
    return new DataSource({
        type: "postgres",
        database: "test",
        installExtensions: false,
        ...options,
        adapter,
    })
}

describe("PostgreSQL client adapters", () => {
    let adapter: TestAdapter
    let dataSource: DataSource
    beforeEach(async () => {
        adapter = new TestAdapter()
        dataSource = source(adapter)
        await dataSource.initialize()
        adapter.queries = []
        adapter.releaseErrors = []
    })
    afterEach(async () => {
        sinon.restore()
        if (dataSource.isInitialized) await dataSource.destroy()
    })

    it("initializes a custom adapter without loading optional native packages", async () => {
        const load = sinon
            .stub(PlatformTools, "load")
            .throws(new Error("unexpected dependency load"))
        const other = source(new TestAdapter())
        await other.initialize()
        await other.destroy()
        expect(load.called).to.equal(false)
    })

    it("preserves normalized results and native subscriber payloads", async () => {
        const native: NativeResult = {
            values: [{ id: 1 }],
            changed: 1,
            kind: "UPDATE",
        }
        sinon.stub(adapter, "query").resolves(native)
        const events: AfterQueryEvent[] = []
        dataSource.subscribers.push({
            afterQuery: (event: AfterQueryEvent) => {
                events.push(event)
            },
        })
        const runner = dataSource.createQueryRunner()
        expect(
            await runner.query("UPDATE items RETURNING id", [1]),
        ).to.deep.equal([[{ id: 1 }], 1])
        const result: QueryResult = await runner.query(
            "UPDATE items RETURNING id",
            [1],
            true,
        )
        expect(result.records).to.deep.equal([{ id: 1 }])
        expect(result.affected).to.equal(1)
        expect(events).to.have.length(2)
        expect(events[0].rawResults).to.equal(native)
        await runner.release()
    })

    it("pins one connection across nested transactions and savepoints", async () => {
        const runner = dataSource.createQueryRunner()
        await runner.startTransaction()
        await runner.startTransaction()
        await runner.query("SELECT 1")
        await runner.rollbackTransaction()
        await runner.commitTransaction()
        expect(
            new Set(adapter.queries.map((entry) => entry.connection)).size,
        ).to.equal(1)
        expect(adapter.queries.map((entry) => entry.sql)).to.deep.equal([
            "START TRANSACTION",
            "SAVEPOINT typeorm_1",
            "SELECT 1",
            "ROLLBACK TO SAVEPOINT typeorm_1",
            "COMMIT",
        ])
        const before = adapter.releaseErrors.length
        await Promise.all([runner.release(), runner.release()])
        expect(adapter.releaseErrors).to.have.length(before + 1)
        expect(
            (dataSource.driver as PostgresDriver).connectedQueryRunners,
        ).to.have.length(0)
        await rejects(runner.connect(), QueryRunnerAlreadyReleasedError)
    })

    it("awaits asynchronous release, including a concurrent second release", async () => {
        let finish!: () => void
        const gate = new Promise<void>((resolve) => {
            finish = resolve
        })
        const release = sinon.stub().returns(gate)
        sinon.stub(adapter, "acquire").resolves([{}, release])
        const runner = dataSource.createQueryRunner()
        await runner.connect()
        let finished = false
        const first = runner.release().then(() => {
            finished = true
        })
        const second = runner.release()
        await Promise.resolve()
        expect(finished).to.equal(false)
        finish()
        await Promise.all([first, second])
        expect(release.calledOnce).to.equal(true)
    })

    it("releases a connection acquired after release has started", async () => {
        let finish!: (value: [unknown, PostgresConnectionRelease]) => void
        const gate = new Promise<[unknown, PostgresConnectionRelease]>(
            (resolve) => {
                finish = resolve
            },
        )
        const release = sinon.stub().resolves()
        sinon.stub(adapter, "acquire").returns(gate)
        const runner = dataSource.createQueryRunner()
        const connected = rejects(
            runner.connect(),
            QueryRunnerAlreadyReleasedError,
        )
        const released = runner.release()
        finish([{}, release])
        await Promise.all([connected, released])
        expect(release.calledOnce).to.equal(true)
    })

    it("allows retry after acquisition failure", async () => {
        const failure = new Error("acquire failed")
        const acquire = sinon.stub(adapter, "acquire")
        acquire.onFirstCall().rejects(failure)
        acquire.onSecondCall().resolves([{}, () => Promise.resolve()])
        const runner = dataSource.createQueryRunner()
        await rejects(runner.connect(), failure)
        await runner.connect()
        expect(acquire.calledTwice).to.equal(true)
        await runner.release()
    })

    it("retains failed SQL connections for transaction rollback", async () => {
        const runner = dataSource.createQueryRunner()
        await runner.startTransaction()
        const failure = new Error("query failed")
        sinon
            .stub(adapter, "query")
            .onFirstCall()
            .rejects(failure)
            .callThrough()
        await rejects(runner.query("invalid SQL"), QueryFailedError)
        expect(runner.isReleased).to.equal(false)
        await runner.rollbackTransaction()
        await runner.release()
    })

    it("discards a connection on a fatal native error", async () => {
        const runner = dataSource.createQueryRunner()
        const connection = (await runner.connect()) as Connection
        const failure = new Error("socket closed")
        connection.error!(failure)
        await runner.release()
        expect(adapter.releaseErrors).to.deep.equal([failure])
        expect(connection.error).to.equal(undefined)
        expect(
            (dataSource.driver as PostgresDriver).connectedQueryRunners,
        ).to.have.length(0)
    })

    it("cleans up when error subscription fails", async () => {
        const failure = new Error("subscription failed")
        sinon.stub(adapter, "onError").throws(failure)
        const runner = dataSource.createQueryRunner()
        await rejects(runner.connect(), failure)
        expect(adapter.releaseErrors).to.deep.equal([failure])
        await runner.release()
        expect(adapter.releaseErrors).to.have.length(1)
    })

    it("rejects unsupported streams before acquiring a connection", async () => {
        const acquire = sinon.spy(adapter, "acquire")
        const runner = dataSource.createQueryRunner()
        let failure: unknown
        try {
            await runner.stream("SELECT 1")
        } catch (error) {
            failure = error
        }
        expect(String(failure)).to.contain("does not support streaming")
        expect(acquire.called).to.equal(false)
        await runner.release()
    })

    it("releases nontransaction connections if stream creation fails", async () => {
        const failure = new Error("stream failed")
        const streaming = Object.assign(adapter, {
            stream: () => Promise.reject(failure),
        })
        expect(streaming).to.equal(adapter)
        const runner = dataSource.createQueryRunner()
        await rejects(runner.stream("SELECT 1"), failure)
        expect(runner.isReleased).to.equal(true)
        expect(adapter.releaseErrors).to.deep.equal([failure])
    })

    it("cleans every pool created before replication initialization fails", async () => {
        const otherAdapter = new TestAdapter()
        const create = sinon.stub(otherAdapter, "createPool").callThrough()
        const failure = new Error("master unavailable")
        create
            .withArgs(sinon.match.any, sinon.match({ host: "master" }))
            .rejects(failure)
        const other = source(otherAdapter, {
            replication: {
                master: { host: "master" },
                slaves: [{ host: "reader-1" }, { host: "reader-2" }],
            },
        })
        await rejects(other.initialize(), failure)
        expect(otherAdapter.pools).to.have.length(2)
        expect(otherAdapter.pools.every((pool) => pool.closed)).to.equal(true)
    })

    it("routes master and slave connections through the selected adapter", async () => {
        const otherAdapter = new TestAdapter()
        const other = source(otherAdapter, {
            replication: {
                master: { host: "master" },
                slaves: [{ host: "reader" }],
            },
        })
        await other.initialize()
        const master = other.createQueryRunner("master"),
            slave = other.createQueryRunner("slave")
        expect(((await master.connect()) as Connection).pool.host).to.equal(
            "master",
        )
        expect(((await slave.connect()) as Connection).pool.host).to.equal(
            "reader",
        )
        await other.destroy()
        expect(otherAdapter.pools.every((pool) => pool.closed)).to.equal(true)
        expect(
            otherAdapter.connections.every((connection) => connection.released),
        ).to.equal(true)
    })

    it("closes successful slave pools when another slave fails", async () => {
        const otherAdapter = new TestAdapter()
        const failure = new Error("reader unavailable")
        const create = sinon.stub(otherAdapter, "createPool").callThrough()
        create
            .withArgs(sinon.match.any, sinon.match({ host: "bad" }))
            .rejects(failure)
        const other = source(otherAdapter, {
            replication: {
                master: { host: "master" },
                slaves: [{ host: "good" }, { host: "bad" }],
            },
        })
        await rejects(other.initialize(), failure)
        expect(otherAdapter.pools).to.deep.equal([
            { host: "good", closed: true },
        ])
    })

    it("attempts every pool shutdown even when one close fails", async () => {
        const otherAdapter = new TestAdapter()
        const other = source(otherAdapter, {
            replication: {
                master: { host: "master" },
                slaves: [{ host: "reader" }],
            },
        })
        await other.initialize()
        const failure = new Error("close failed")
        const close = sinon.stub(otherAdapter, "closePool").callThrough()
        close.onFirstCall().rejects(failure)
        await rejects(other.destroy(), failure)
        expect(close.calledTwice).to.equal(true)
        expect(otherAdapter.pools[0].closed).to.equal(true)
    })

    it("releases after extension metadata failure during afterConnect", async () => {
        const otherAdapter = new TestAdapter()
        const other = source(otherAdapter, { installExtensions: true })
        const failure = new Error("extension metadata failed")
        sinon
            .stub(
                other.driver as unknown as {
                    checkMetadataForExtensions(): Promise<unknown>
                },
                "checkMetadataForExtensions",
            )
            .rejects(failure)
        await rejects(other.initialize(), failure)
        expect(
            otherAdapter.connections.every((connection) => connection.released),
        ).to.equal(true)
        expect(otherAdapter.pools.every((pool) => pool.closed)).to.equal(true)
    })

    it("invokes stream completion once on early cancellation or normal end", async () => {
        const native = new PassThrough({ objectMode: true })
        Object.assign(adapter, {
            stream: () => native as unknown as ReadStream,
        })
        const runner = dataSource.createQueryRunner()
        const completed = sinon.stub()
        const stream = await runner.stream("SELECT 1", [], completed)
        stream.emit("end")
        stream.emit("close")
        expect(completed.calledOnce).to.equal(true)
        native.destroy()
        await runner.release()
    })

    it("closes pools and releases connections after bootstrap query failure", async () => {
        const otherAdapter = new TestAdapter()
        sinon.stub(otherAdapter, "query").rejects(new Error("bootstrap failed"))
        await rejects(source(otherAdapter).initialize(), QueryFailedError)
        expect(otherAdapter.pools.every((pool) => pool.closed)).to.equal(true)
        expect(
            otherAdapter.connections.every((connection) => connection.released),
        ).to.equal(true)
    })

    it("removes runner registration even if release rejects", async () => {
        const failure = new Error("release failed")
        sinon
            .stub(adapter, "acquire")
            .resolves([{}, () => Promise.reject(failure)])
        const runner = dataSource.createQueryRunner()
        await runner.connect()
        await rejects(runner.release(), failure)
        expect(
            (dataSource.driver as PostgresDriver).connectedQueryRunners,
        ).to.have.length(0)
    })
})

describe("pg adapter compatibility", () => {
    afterEach(() => sinon.restore())
    it("retains driver and nativeDriver module override meanings", () => {
        const native = { Pool: class {} }
        const module = { Pool: class {}, native }
        const load = sinon
            .stub(PlatformTools, "load")
            .throws(new Error("unexpected load"))
        const adapter = new PgDriverAdapter({
            type: "postgres",
            driver: module,
            nativeDriver: {},
        })
        expect(adapter.postgres).to.equal(native)
        expect(load.called).to.equal(false)
    })
    it("normalizes pg SELECT, INSERT, UPDATE and DELETE results", () => {
        const adapter = new PgDriverAdapter({
            type: "postgres",
            driver: { Pool: class {} },
            nativeDriver: false,
        })
        for (const command of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
            const result = adapter.normalizeResult({
                command,
                rows: [{ id: 1 }],
                rowCount: 1,
            })
            expect(result.records).to.deep.equal([{ id: 1 }])
            expect(result.affected).to.equal(1)
            expect(result.raw).to.deep.equal(
                ["UPDATE", "DELETE"].includes(command)
                    ? [[{ id: 1 }], 1]
                    : [{ id: 1 }],
            )
        }
    })
    it("ends a native pool when its initial connection fails", async () => {
        const failure = new Error("native connect failed")
        let ended = 0
        class Pool extends EventEmitter {
            connect(callback: (error: Error) => void) {
                callback(failure)
            }
            end(callback: () => void) {
                ended++
                callback()
            }
        }
        const options = {
            type: "postgres" as const,
            driver: { Pool },
            nativeDriver: false,
        }
        const adapter = new PgDriverAdapter(options)
        const logger = new DataSource({ ...options }).logger
        await rejects(adapter.createPool(options, {}, logger), failure)
        expect(ended).to.equal(1)
    })
})
