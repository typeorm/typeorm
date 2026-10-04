import { expect } from "chai"
import type { EventEmitter } from "events"
import { EntitySchema, QueryResult, Table } from "../../../../src"
import type {
    DataSource,
    MigrationInterface,
    QueryRunner,
    PostgresDriverAdapter,
    PostgresDataSourceOptions,
    PostgresConnectionCredentialsOptions,
    PostgresConnectionRelease,
} from "../../../../src"
import { PlatformTools } from "../../../../src/platform/PlatformTools"
import type { ReadStream } from "../../../../src/platform/PlatformTools"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

interface NativeResult {
    rows: unknown[]
    rowCount: number
    command: string
}
interface NativeClient extends EventEmitter {
    query(sql: string, parameters?: unknown[]): Promise<NativeResult>
    query(cursor: unknown): ReadStream
    release(error?: Error): void
}
interface NativePool {
    connect(): Promise<NativeClient>
    end(): Promise<void>
}
interface PoolHandle {
    oracle: NativePool
}
interface ConnectionHandle {
    reserved: NativeClient
}
interface AdapterResult {
    items: unknown[]
    count: number
    statement: string
}

// Test transport oracle only: public handles/results deliberately do not have pg's API.
class IndependentAdapter implements PostgresDriverAdapter {
    active = 0
    async createPool(
        _options: PostgresDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
    ): Promise<unknown> {
        const pg = PlatformTools.load("pg") as {
            Pool: new (options: object) => NativePool
        }
        const pool = new pg.Pool({
            connectionString: credentials.url,
            host: credentials.host,
            port: credentials.port,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            ssl: credentials.ssl,
        })
        try {
            const probe = await pool.connect()
            probe.release()
            return { oracle: pool }
        } catch (error) {
            await pool.end()
            throw error
        }
    }
    closePool(pool: unknown): Promise<void> {
        return (pool as PoolHandle).oracle.end()
    }
    async acquire(
        pool: unknown,
    ): Promise<[unknown, PostgresConnectionRelease]> {
        const client = await (pool as PoolHandle).oracle.connect()
        this.active++
        return [
            { reserved: client },
            (error?: Error) => {
                this.active--
                client.release(error)
            },
        ]
    }
    async query(
        connection: unknown,
        sql: string,
        parameters?: unknown[],
    ): Promise<unknown> {
        const result = await (connection as ConnectionHandle).reserved.query(
            sql,
            parameters,
        )
        return {
            items: result.rows,
            count: result.rowCount,
            statement: result.command,
        }
    }
    normalizeResult(value: unknown): QueryResult {
        const native = value as AdapterResult
        const result = new QueryResult()
        result.records = native.items
        result.affected = native.count
        result.raw = ["UPDATE", "DELETE"].includes(native.statement)
            ? [native.items, native.count]
            : native.items
        return result
    }
    onError(connection: unknown, listener: (error: Error) => void): () => void {
        const client = (connection as ConnectionHandle).reserved
        client.on("error", listener)
        return () => {
            client.removeListener("error", listener)
        }
    }
    stream(
        connection: unknown,
        sql: string,
        parameters?: unknown[],
    ): ReadStream {
        const QueryStream = PlatformTools.load("pg-query-stream") as new (
            sql: string,
            parameters?: unknown[],
        ) => unknown
        return (connection as ConnectionHandle).reserved.query(
            new QueryStream(sql, parameters),
        )
    }
}

interface Item {
    id: number
    label: string
    payload: { nested: string }
    tags: string[]
}
const ItemSchema = new EntitySchema<Item>({
    name: "AdapterItem",
    tableName: "adapter_item",
    columns: {
        id: { type: Number, primary: true, generated: true },
        label: { type: String },
        payload: { type: "jsonb" },
        tags: { type: "text", array: true },
    },
})
class AdapterMigration1780000000000 implements MigrationInterface {
    async up(runner: QueryRunner): Promise<void> {
        await runner.createTable(
            new Table({
                name: "adapter_migration",
                columns: [{ name: "id", type: "integer", isPrimary: true }],
            }),
        )
    }
    async down(runner: QueryRunner): Promise<void> {
        await runner.dropTable("adapter_migration")
    }
}

describe("driver > postgres > independent client adapter", () => {
    let dataSources: DataSource[]
    const adapter = new IndependentAdapter()
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [ItemSchema],
            migrations: [AdapterMigration1780000000000],
            driverSpecific: { adapter },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("runs CRUD, RETURNING and value conversion with opaque native results", () =>
        Promise.all(
            dataSources.map(async (source) => {
                const repository = source.getRepository(ItemSchema)
                const item = await repository.save({
                    label: "first",
                    payload: { nested: "value" },
                    tags: ["a", "b"],
                })
                expect(item.id).to.be.a("number")
                expect(
                    await repository.findOneByOrFail({ id: item.id }),
                ).to.deep.equal(item)
                const updated = await repository
                    .createQueryBuilder()
                    .update()
                    .set({ label: "second" })
                    .where("id = :id", { id: item.id })
                    .returning(["id", "label"])
                    .execute()
                expect(updated.affected).to.equal(1)
                expect(updated.raw).to.deep.equal([
                    { id: item.id, label: "second" },
                ])
                const deleted = await repository
                    .createQueryBuilder()
                    .delete()
                    .where("id = :id", { id: item.id })
                    .returning("id")
                    .execute()
                expect(deleted.affected).to.equal(1)
                expect(deleted.raw).to.deep.equal([{ id: item.id }])
                expect(await repository.count()).to.equal(0)
            }),
        ))

    it("keeps transactions and nested savepoints on one native session", () =>
        Promise.all(
            dataSources.map(async (source) => {
                const runner = source.createQueryRunner()
                try {
                    await runner.startTransaction()
                    const outer = await runner.manager.save(ItemSchema, {
                        label: "outer",
                        payload: { nested: "x" },
                        tags: [],
                    })
                    await runner.startTransaction()
                    await runner.manager.save(ItemSchema, {
                        label: "inner",
                        payload: { nested: "y" },
                        tags: [],
                    })
                    await runner.rollbackTransaction()
                    await runner.commitTransaction()
                    expect(
                        await source.getRepository(ItemSchema).find(),
                    ).to.deep.equal([outer])
                    await runner.startTransaction()
                    await runner.manager.delete(ItemSchema, outer.id)
                    await runner.rollbackTransaction()
                    expect(
                        await source.getRepository(ItemSchema).count(),
                    ).to.equal(1)
                } finally {
                    await runner.release()
                }
            }),
        ))

    it("round-trips schema synchronization and migrations", () =>
        Promise.all(
            dataSources.map(async (source) => {
                expect(
                    (await source.driver.createSchemaBuilder().log()).upQueries,
                ).to.have.length(0)
                expect(await source.runMigrations()).to.have.length(1)
                const runner = source.createQueryRunner()
                try {
                    expect(await runner.hasTable("adapter_migration")).to.equal(
                        true,
                    )
                    await source.undoLastMigration()
                    expect(await runner.hasTable("adapter_migration")).to.equal(
                        false,
                    )
                } finally {
                    await runner.release()
                }
            }),
        ))

    it("streams parameterized rows and releases QueryBuilder streams on cancellation", () =>
        Promise.all(
            dataSources.map(async (source) => {
                const runner = source.createQueryRunner()
                try {
                    const stream = await runner.stream(
                        "SELECT generate_series(1, $1) AS n",
                        [3],
                    )
                    const rows: unknown[] = []
                    for await (const row of stream) rows.push(row)
                    expect(rows).to.deep.equal([{ n: 1 }, { n: 2 }, { n: 3 }])
                } finally {
                    await runner.release()
                }
                const stream = await source
                    .getRepository(ItemSchema)
                    .createQueryBuilder("item")
                    .stream()
                await new Promise<void>((resolve, reject) => {
                    stream.once("close", resolve)
                    stream.once("error", reject)
                    stream.destroy()
                })
                await new Promise<void>((resolve) => setImmediate(resolve))
                expect(adapter.active).to.equal(0)
            }),
        ))

    it("retains native subscriber payloads without leaking pg result fields", () =>
        Promise.all(
            dataSources.map(async (source) => {
                const results: unknown[] = []
                const subscriber = {
                    afterQuery: (event: { rawResults?: unknown }) => {
                        results.push(event.rawResults)
                    },
                }
                source.subscribers.push(subscriber)
                try {
                    expect(
                        await source.query("SELECT $1::int AS n", [7]),
                    ).to.deep.equal([{ n: 7 }])
                    expect(results).to.deep.equal([
                        { items: [{ n: 7 }], count: 1, statement: "SELECT" },
                    ])
                } finally {
                    source.subscribers.splice(
                        source.subscribers.indexOf(subscriber),
                        1,
                    )
                }
            }),
        ))
})
