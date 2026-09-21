import { EventEmitter } from "node:events"
import { Readable } from "node:stream"

import type { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions"
import type { PostgresJsDataSourceOptions } from "./PostgresJsDataSourceOptions"

type PostgresJsRow = Record<string, unknown>
type PostgresJsNotice = Record<string, unknown>
type PostgresJsOptions = Record<string, unknown>
type PostgresJsListener = (...args: unknown[]) => void

interface PostgresJsResult<
    Row extends PostgresJsRow = PostgresJsRow,
> extends Array<Row> {
    count?: number | null
    command?: string
}

interface PostgresJsPendingQuery<
    Row extends PostgresJsRow = PostgresJsRow,
> extends PromiseLike<PostgresJsResult<Row>> {
    cursor(batchSize?: number): AsyncIterable<Row[]>
}

interface PostgresJsSql {
    unsafe(
        query: string,
        parameters?: unknown[],
    ): PostgresJsPendingQuery<PostgresJsRow>
    reserve(): Promise<PostgresJsReservedSql>
    end(): Promise<void>
}

interface PostgresJsReservedSql extends PostgresJsSql {
    release(): void
}

export interface PostgresJsFactory {
    (options?: PostgresJsOptions): PostgresJsSql
    (url: string, options?: PostgresJsOptions): PostgresJsSql
}

export interface PostgresJsQueryResult<
    Row extends PostgresJsRow = PostgresJsRow,
> {
    rows: Row[]
    rowCount: number
    command?: string
}

export interface PostgresJsMappedOptions {
    url?: string
    options: PostgresJsOptions
}

/**
 * Marks a value that Postgres.js should encode with PostgreSQL's JSON codec.
 *
 * Postgres.js discovers the target OID before binding an unsafe query. Keeping
 * the original JavaScript value behind an object prevents arrays and dates
 * from being mistaken for PostgreSQL array or timestamp parameters.
 */
export class PostgresJsJsonParameter {
    constructor(readonly value: unknown) {}

    toJSON(): unknown {
        return this.value
    }

    toString(): string {
        return JSON.stringify(this.value) ?? ""
    }
}

class PostgresJsSerializedJsonParameter extends PostgresJsJsonParameter {
    constructor(
        private readonly serialized: string,
        value: unknown,
    ) {
        super(value)
    }

    override toString(): string {
        return this.serialized
    }
}

interface PostgresJsOptionCallbacks {
    onNotice?: (notice: PostgresJsNotice) => void
    onNotification?: (channel: string, payload: string) => void
    onWarning?: (message: string) => void
}

const unsupportedPgOptions: Record<string, string> = {
    allowExitOnIdle:
        "Remove it and close the DataSource normally; Postgres.js shuts down through sql.end().",
    maxUses:
        'Postgres.js has no use-count equivalent; use "max_lifetime" for time-based recycling.',
    query_timeout:
        'Use "connection.statement_timeout" or application-level cancellation.',
}

/**
 * Marker consumed by {@link PostgresJsConnection.query} to create a cursor stream.
 */
export class PostgresJsQueryStream {
    constructor(
        readonly query: string,
        readonly parameters?: unknown[],
        readonly batchSize: number = 100,
    ) {}
}

/**
 * Maps TypeORM's PostgreSQL options to Postgres.js without mutating the input.
 *
 * @param dataSourceOptions TypeORM DataSource options.
 * @param credentials Credentials for the selected pool.
 * @param callbacks Adapter diagnostics and notice forwarding.
 * @returns Postgres.js URL overload and native options.
 */
export function buildPostgresJsOptions(
    dataSourceOptions: PostgresJsDataSourceOptions,
    credentials: PostgresConnectionCredentialsOptions,
    callbacks: PostgresJsOptionCallbacks = {},
): PostgresJsMappedOptions {
    const extra = { ...(dataSourceOptions.extra ?? {}) }
    const nativeConnection = isRecord(extra.connection)
        ? { ...extra.connection }
        : {}
    const nativeTypes = isRecord(extra.types) ? { ...extra.types } : {}

    addDefaultPostgresJsType(nativeTypes, "typeormDate", 1082, {
        serialize: (value) =>
            value instanceof Date
                ? value.toISOString().slice(0, 10)
                : String(value),
        parse: String,
    })
    addDefaultPostgresJsType(nativeTypes, "typeormInterval", 1186, {
        serialize: String,
        parse: parsePostgresInterval,
    })
    addDefaultPostgresJsType(nativeTypes, "typeormPoint", 600, {
        serialize: String,
        parse: parsePostgresPoint,
    })
    addDefaultPostgresJsType(nativeTypes, "typeormCircle", 718, {
        serialize: String,
        parse: parsePostgresCircle,
    })

    if (dataSourceOptions.parseInt8) {
        if (!hasParserForOid(nativeTypes, 20)) {
            nativeTypes.typeormInt8 = {
                to: 20,
                from: [20],
                serialize: String,
                parse: parseSafeInteger,
            }
        }
    }
    extra.types = nativeTypes

    for (const [key, guidance] of Object.entries(unsupportedPgOptions)) {
        if (key in extra) {
            callbacks.onWarning?.(
                `Postgres.js does not support pg option "${key}". ${guidance}`,
            )
            delete extra[key]
        }
    }

    mapMillisecondAlias(extra, "connectionTimeoutMillis", "connect_timeout")
    mapMillisecondAlias(extra, "idleTimeoutMillis", "idle_timeout")

    if (
        nativeConnection.application_name === undefined &&
        extra.application_name !== undefined
    ) {
        nativeConnection.application_name = extra.application_name
    }
    delete extra.application_name
    delete extra.connection

    const userOnNotice = extra.onnotice
    if (typeof userOnNotice === "function" || callbacks.onNotice) {
        extra.onnotice = (notice: PostgresJsNotice) => {
            if (typeof userOnNotice === "function") userOnNotice(notice)
            callbacks.onNotice?.(notice)
        }
    }

    const userOnNotify = extra.onnotify
    if (typeof userOnNotify === "function" || callbacks.onNotification) {
        extra.onnotify = (channel: string, payload: string) => {
            if (typeof userOnNotify === "function") {
                userOnNotify(channel, payload)
            }
            callbacks.onNotification?.(channel, payload)
        }
    }

    const connection = compact({
        application_name:
            dataSourceOptions.applicationName ?? credentials.applicationName,
        ...nativeConnection,
    })

    return {
        url: credentials.url,
        options: compact({
            host: credentials.host,
            port: credentials.port,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            ssl: credentials.ssl,
            max: dataSourceOptions.poolSize,
            connect_timeout: millisecondsToSeconds(
                dataSourceOptions.connectTimeoutMS,
            ),
            connection:
                Object.keys(connection).length > 0 ? connection : undefined,
            ...extra,
        }),
    }
}

/**
 * pg-shaped pool facade used by the shared PostgreSQL driver.
 */
export class PostgresJsPool {
    private readonly events = new EventEmitter()
    private readonly sql: PostgresJsSql
    private endPromise?: Promise<void>

    constructor(
        factory: PostgresJsFactory,
        dataSourceOptions: PostgresJsDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
        onWarning?: (message: string) => void,
    ) {
        const mapped = buildPostgresJsOptions(dataSourceOptions, credentials, {
            onNotice: (notice) => this.events.emit("notice", notice),
            onNotification: (channel, payload) =>
                this.events.emit("notification", { channel, payload }),
            onWarning,
        })
        this.sql = mapped.url
            ? factory(mapped.url, mapped.options)
            : factory(mapped.options)
    }

    on(event: string, listener: PostgresJsListener): this {
        this.events.on(event, listener)
        return this
    }

    removeListener(event: string, listener: PostgresJsListener): this {
        this.events.removeListener(event, listener)
        return this
    }

    connect(
        callback: (
            error: unknown,
            connection?: PostgresJsConnection,
            release?: (error?: unknown) => void,
        ) => void,
    ): void {
        void this.sql.reserve().then(
            (reserved) => {
                const release = releaseOnce(reserved)
                callback(
                    null,
                    new PostgresJsConnection(reserved, this.events, release),
                    release,
                )
            },
            (error: unknown) => callback(error),
        )
    }

    async query(
        query: string,
        parameters?: unknown[],
    ): Promise<PostgresJsQueryResult> {
        const reserved = await this.sql.reserve()
        try {
            return await executeQuery(reserved, query, parameters)
        } finally {
            reserved.release()
        }
    }

    end(callback?: (error?: unknown) => void): Promise<void> {
        this.endPromise ??= this.sql.end()
        if (callback) {
            void this.endPromise.then(
                () => callback(),
                (error: unknown) => callback(error),
            )
        }
        return this.endPromise
    }
}

export class PostgresJsConnection {
    private queryTail: Promise<void> = Promise.resolve()

    constructor(
        private readonly reserved: PostgresJsReservedSql,
        private readonly events: EventEmitter,
        private readonly releaseReserved: (error?: unknown) => void,
    ) {}

    on(event: string, listener: PostgresJsListener): this {
        this.events.on(event, listener)
        return this
    }

    removeListener(event: string, listener: PostgresJsListener): this {
        this.events.removeListener(event, listener)
        return this
    }

    release(error?: unknown): void {
        this.releaseReserved(error)
    }

    query(query: PostgresJsQueryStream): Readable
    query(
        query: string,
        callback: (error: unknown, result?: PostgresJsQueryResult) => void,
    ): void
    query(query: string, parameters?: unknown[]): Promise<PostgresJsQueryResult>
    query(
        query: string,
        parameters: unknown[],
        callback: (error: unknown, result?: PostgresJsQueryResult) => void,
    ): void
    query(
        query: string | PostgresJsQueryStream,
        parametersOrCallback?:
            | unknown[]
            | ((error: unknown, result?: PostgresJsQueryResult) => void),
        callback?: (error: unknown, result?: PostgresJsQueryResult) => void,
    ): Promise<PostgresJsQueryResult> | Readable | void {
        if (query instanceof PostgresJsQueryStream) {
            const before = this.queryTail
            let finish: (() => void) | undefined
            this.queryTail = new Promise<void>((resolve) => {
                finish = resolve
            })
            return createCursorStream(this.reserved, query, before, () =>
                finish?.(),
            )
        }

        const parameters = Array.isArray(parametersOrCallback)
            ? parametersOrCallback
            : undefined
        const queryCallback =
            typeof parametersOrCallback === "function"
                ? parametersOrCallback
                : callback
        const pending = this.queryTail.then(() =>
            executeQuery(this.reserved, query, parameters),
        )
        this.queryTail = pending.then(
            () => undefined,
            () => undefined,
        )

        if (queryCallback) {
            void pending.then(
                (result) => queryCallback(null, result),
                (error: unknown) => queryCallback(error),
            )
            return
        }

        return pending
    }
}

/**
 * Creates a backpressure-aware stream over cursor batches.
 *
 * @param reserved Reserved Postgres.js connection.
 * @param query Cursor query marker.
 * @param before Prior connection work that must finish before the cursor starts.
 * @param finish Releases the connection queue after the cursor finishes.
 * @returns Object-mode row stream.
 */
function createCursorStream(
    reserved: PostgresJsReservedSql,
    query: PostgresJsQueryStream,
    before: Promise<void> = Promise.resolve(),
    finish: () => void = () => undefined,
): Readable {
    /** @yields {PostgresJsRow} Rows from each cursor batch. */
    async function* rows() {
        await before
        try {
            const pending = reserved.unsafe(
                query.query,
                preparePostgresJsParameters(query.parameters),
            )
            for await (const batch of pending.cursor(query.batchSize)) {
                yield* batch
            }
        } finally {
            finish()
        }
    }

    return Readable.from(rows(), { objectMode: true, highWaterMark: 1 })
}

/**
 * Executes and normalizes one Postgres.js query.
 *
 * @param reserved Reserved Postgres.js connection.
 * @param query SQL text.
 * @param parameters Positional parameters.
 * @returns pg-shaped query result.
 */
async function executeQuery(
    reserved: Pick<PostgresJsReservedSql, "unsafe">,
    query: string,
    parameters?: unknown[],
): Promise<PostgresJsQueryResult> {
    const result = await reserved.unsafe(
        query,
        preparePostgresJsParameters(parameters),
    )
    const rows = Array.from(result)
    return {
        rows,
        rowCount: result.count ?? rows.length,
        command: result.command,
    }
}

/**
 * Converts values whose pg wire representation differs from Postgres.js.
 *
 * PostgreSQL array OIDs created after a Postgres.js connection starts do not
 * have a native serializer registered on that connection. A text array
 * literal remains lossless for both built-in and newly-created array types.
 * JSON strings are wrapped so Postgres.js does not stringify TypeORM/raw-SQL
 * JSON a second time after target-type discovery.
 *
 * @param parameters TypeORM positional parameters.
 * @returns Parameters safe for Postgres.js unsafe queries.
 */
function preparePostgresJsParameters(
    parameters?: unknown[],
): unknown[] | undefined {
    if (!parameters) return parameters

    let changed = false
    const prepared = parameters.map((parameter) => {
        const value = preparePostgresJsParameter(parameter)
        if (value !== parameter) changed = true
        return value
    })
    return changed ? prepared : parameters
}

/**
 * Converts one TypeORM parameter for Postgres.js binding.
 *
 * @param value TypeORM parameter value.
 * @returns Postgres.js-compatible parameter value.
 */
function preparePostgresJsParameter(value: unknown): unknown {
    if (value === undefined) return null
    if (value instanceof PostgresJsJsonParameter) return value
    if (Array.isArray(value)) return serializePostgresArray(value)

    if (typeof value === "string") {
        try {
            return new PostgresJsSerializedJsonParameter(
                value,
                JSON.parse(value),
            )
        } catch {
            return value
        }
    }

    return value
}

/**
 * Installs a TypeORM compatibility codec unless a native codec owns the OID.
 *
 * @param types Postgres.js native type map.
 * @param name Internal codec name.
 * @param oid PostgreSQL OID.
 * @param codec Value serializer and parser.
 * @param codec.serialize Value serializer.
 * @param codec.parse Value parser.
 */
function addDefaultPostgresJsType(
    types: Record<string, unknown>,
    name: string,
    oid: number,
    codec: {
        serialize: (value: unknown) => string
        parse: (raw: string) => unknown
    },
): void {
    if (hasParserForOid(types, oid)) return
    types[name] = { to: oid, from: [oid], ...codec }
}

/**
 * Parses PostgreSQL's standard point text representation.
 *
 * @param raw PostgreSQL point.
 * @returns Point coordinates.
 */
function parsePostgresPoint(raw: string): { x: number; y: number } {
    const [x, y] = raw.slice(1, -1).split(",").map(Number)
    return { x, y }
}

/**
 * Parses PostgreSQL's standard circle text representation.
 *
 * @param raw PostgreSQL circle.
 * @returns Circle center and radius.
 */
function parsePostgresCircle(raw: string): {
    x: number
    y: number
    radius: number
} {
    const match = /^<\(([^,]+),([^)]+)\),([^>]+)>$/.exec(raw)
    if (!match) return { x: Number.NaN, y: Number.NaN, radius: Number.NaN }
    return {
        x: Number(match[1]),
        y: Number(match[2]),
        radius: Number(match[3]),
    }
}

/**
 * Parses PostgreSQL's default interval text into TypeORM's established shape.
 *
 * @param raw PostgreSQL interval.
 * @returns Present interval components.
 */
function parsePostgresInterval(raw: string): Record<string, number> {
    const match =
        /^(?:([+-]?\d+)\s+years?\s*)?(?:([+-]?\d+)\s+mons?\s*)?(?:([+-]?\d+)\s+days?\s*)?(?:([+-])?(\d+):(\d{2}):(\d{2})(?:\.(\d{1,6}))?)?$/.exec(
            raw,
        )
    if (!match) return {}

    const interval: Record<string, number> = {}
    const assign = (name: string, value: string | undefined) => {
        if (value !== undefined && Number(value) !== 0) {
            interval[name] = Number(value)
        }
    }
    assign("years", match[1])
    assign("months", match[2])
    assign("days", match[3])

    const sign = match[4] === "-" ? -1 : 1
    assign("hours", match[5] && String(sign * Number(match[5])))
    assign("minutes", match[6] && String(sign * Number(match[6])))
    assign("seconds", match[7] && String(sign * Number(match[7])))
    if (match[8]) {
        const milliseconds =
            (sign * Number(`${match[8]}${"0".repeat(6 - match[8].length)}`)) /
            1000
        if (milliseconds !== 0) interval.milliseconds = milliseconds
    }
    return interval
}

/**
 * Serializes an array using PostgreSQL's text array format.
 *
 * @param values Array parameter.
 * @returns PostgreSQL array literal.
 */
function serializePostgresArray(values: unknown[]): string {
    return `{${values.map(serializePostgresArrayItem).join(",")}}`
}

/**
 * Serializes one nested PostgreSQL array item.
 *
 * @param value Array item.
 * @returns Escaped PostgreSQL array item.
 */
function serializePostgresArrayItem(value: unknown): string {
    if (value === null || value === undefined) return "NULL"
    if (Array.isArray(value)) return serializePostgresArray(value)

    let serialized: string
    if (value instanceof Date) {
        serialized = value.toISOString()
    } else if (value instanceof Uint8Array) {
        serialized = `\\x${Buffer.from(value).toString("hex")}`
    } else if (value instanceof PostgresJsJsonParameter) {
        serialized = value.toString()
    } else if (typeof value === "object") {
        serialized = JSON.stringify(value)
    } else {
        serialized = String(value)
    }

    return `"${serialized.replaceAll(/(["\\])/g, "\\$1")}"`
}

/**
 * Makes a reserved connection release callback idempotent.
 *
 * @param reserved Reserved Postgres.js connection.
 * @returns Idempotent release callback.
 */
function releaseOnce(
    reserved: Pick<PostgresJsReservedSql, "release">,
): (error?: unknown) => void {
    let released = false
    return () => {
        if (released) return
        released = true
        reserved.release()
    }
}

/**
 * Maps a millisecond pg option to its second-based Postgres.js name.
 *
 * @param options Mutable native option copy.
 * @param pgName pg option name.
 * @param postgresJsName Postgres.js option name.
 */
function mapMillisecondAlias(
    options: PostgresJsOptions,
    pgName: string,
    postgresJsName: string,
): void {
    if (
        options[postgresJsName] === undefined &&
        options[pgName] !== undefined
    ) {
        options[postgresJsName] = millisecondsToSeconds(options[pgName])
    }
    delete options[pgName]
}

/**
 * Converts numeric milliseconds to seconds without coercing other values.
 *
 * @param value Millisecond value.
 * @returns Seconds or the original non-number value.
 */
function millisecondsToSeconds(value: unknown): unknown {
    return typeof value === "number" ? value / 1000 : value
}

/**
 * Removes undefined values before invoking Postgres.js.
 *
 * @param value Native option object.
 * @returns A shallow copy without undefined entries.
 */
function compact<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
        Object.entries(value).filter(([, item]) => item !== undefined),
    ) as T
}

/**
 * Checks whether an option can be safely spread as an object.
 *
 * @param value Candidate option.
 * @returns Whether value is a non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Checks whether native Postgres.js types already own an OID parser.
 *
 * @param types Native Postgres.js custom types.
 * @param oid PostgreSQL type OID.
 * @returns Whether the OID is already handled.
 */
function hasParserForOid(types: Record<string, unknown>, oid: number): boolean {
    return Object.values(types).some((type) => {
        if (!isRecord(type)) return false
        const from = type.from
        return Array.isArray(from) && from.includes(oid)
    })
}

/**
 * Parses int8 values only while they remain lossless JavaScript integers.
 *
 * @param raw PostgreSQL text value.
 * @returns A number when safe, otherwise the original string.
 */
function parseSafeInteger(raw: unknown): unknown {
    const parsed = Number(raw)
    return Number.isSafeInteger(parsed) ? parsed : raw
}
