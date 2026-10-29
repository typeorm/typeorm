import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import type { DataSource } from "../../data-source"
import { FindOperator } from "../../find-options/FindOperator"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import { PlatformTools } from "../../platform/PlatformTools"
import { QueryResult } from "../../query-runner/QueryResult"
import type { Table } from "../../schema-builder/table/Table"
import type { TableColumn } from "../../schema-builder/table/TableColumn"
import type { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import type { View } from "../../schema-builder/view/View"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DateUtils } from "../../util/DateUtils"
import { InstanceChecker } from "../../util/InstanceChecker"
import { OrmUtils } from "../../util/OrmUtils"
import { isUint8Array } from "../../util/Uint8ArrayUtils"
import { SpannerDriver } from "../spanner/SpannerDriver"
import type { ColumnType } from "../types/ColumnTypes"
import type { MappedColumnTypes } from "../types/MappedColumnTypes"
import type { ReplicationMode } from "../types/ReplicationMode"
import type { UpsertType } from "../types/UpsertType"
import type { SpannerPostgresDataSourceOptions } from "./SpannerPostgresDataSourceOptions"
import { SpannerPostgresQueryRunner } from "./SpannerPostgresQueryRunner"

/**
 * Organizes communication with Spanner databases that use the PostgreSQL
 * dialect.
 *
 * Connection and session handling is inherited from {@link SpannerDriver}; this
 * class only swaps the SQL dialect (quoting, parameters, types, table names).
 */
export class SpannerPostgresDriver extends SpannerDriver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Schema of the tables that do not name one: the schema given in the data
     * source options, or the default schema of the database.
     */
    schema?: string

    /**
     * Schema Spanner resolves the names without a schema to. Spanner has no
     * `search_path`, it is always the `public` schema.
     */
    readonly searchSchema: string = "public"

    /**
     * Query runners with DDL queued and not sent yet. A statement of any query
     * runner sends the DDL queued by the others first.
     */
    readonly queryRunnersWithDdl = new Set<SpannerPostgresQueryRunner>()

    /**
     * Cloud Spanner client library, cached.
     */
    private library?: any

    /**
     * Class of the `jsonb` values returned by the client library, cached.
     */
    private jsonbClass?: any

    /**
     * The Spanner type of the items of the array parameters whose items cannot
     * tell it.
     */
    private readonly arrayItemTypes = new WeakMap<
        any[],
        string | ObjectLiteral
    >()

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://cloud.google.com/spanner/docs/reference/postgresql/data-types
     */
    supportedDataTypes: ColumnType[] = [
        "bool",
        "boolean",
        "int",
        "integer",
        "int8",
        "bigint",
        "float",
        "float4",
        "real",
        "float8",
        "double precision",
        "numeric",
        "decimal",
        "varchar",
        "character varying",
        "text",
        "uuid",
        "timestamptz",
        "timestamp with time zone",
        "date",
        "bytea",
        "jsonb",
        "simple-array",
        "simple-json",
    ]

    /**
     * Gets list of upsert types supported by this driver.
     *
     * Spanner only supports `ON CONFLICT` on the primary key columns, and
     * `DO UPDATE` has no `WHERE` clause.
     *
     * @see https://cloud.google.com/spanner/docs/reference/postgresql/dml-syntax#insert-statement
     */
    supportedUpsertTypes: UpsertType[] = ["on-conflict-do-update"]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = ["varchar", "character varying"]

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamptz",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "timestamptz",
        updateDateDefault: "CURRENT_TIMESTAMP",
        deleteDate: "timestamptz",
        deleteDateNullable: true,
        // `int` is stored as `bigint`, but hydrated as a number
        version: "int",
        treeLevel: "int",
        migrationId: "bigint",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "varchar",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "bigint",
        cacheQuery: "text",
        cacheResult: "text",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "text",
    }

    /**
     * The prefix used for the parameters
     */
    parametersPrefix: string = "$"

    /**
     * Represent transaction support by this driver. Nested transactions are not
     * supported, as Spanner has no SAVEPOINT.
     */
    transactionSupport = "simple" as const

    /**
     * Maximum number of query parameters Spanner accepts in a single statement.
     * An INSERT with more parameters is split into several statements.
     *
     * @see https://cloud.google.com/spanner/quotas
     */
    readonly maxQueryParameters: number = 950

    /**
     * Indicates if `bigint` columns are hydrated as numbers instead of strings.
     */
    readonly parseInt8: boolean

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(dataSource: DataSource) {
        super(dataSource)

        const options = dataSource.options as SpannerPostgresDataSourceOptions
        this.schema = options.schema ?? this.searchSchema
        this.parseInt8 = options.parseInt8 ?? false
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a query runner used to execute database queries.
     *
     * @param mode
     */
    createQueryRunner(mode: ReplicationMode) {
        return new SpannerPostgresQueryRunner(this, mode)
    }

    /**
     * Escapes a column name.
     *
     * @param columnName
     */
    escape(columnName: string): string {
        return `"${columnName.replaceAll('"', '""')}"`
    }

    /**
     * Build full table name with schema name and table name.
     * E.g. mySchema.myTable
     *
     * @param tableName
     * @param schema
     */
    buildTableName(tableName: string, schema?: string): string {
        const tablePath = [tableName]

        if (schema) {
            tablePath.unshift(schema)
        }

        return tablePath.join(".")
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     *
     * @param target
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { database?: string; schema?: string; tableName: string } {
        const driverSchema = this.schema

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed = this.parseTableName(target.name)

            return {
                schema: target.schema ?? parsed.schema ?? driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            const parsed = this.parseTableName(target.referencedTableName)

            return {
                schema:
                    target.referencedSchema ?? parsed.schema ?? driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isEntityMetadata(target)) {
            // EntityMetadata tableName is never a path

            return {
                schema: target.schema ?? driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")

        return {
            schema: (parts.length > 1 ? parts[0] : undefined) ?? driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        }
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     *
     * @param value
     * @param columnMetadata
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        return this.prepareParameterValue(value, columnMetadata, true)
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     *
     * @param value
     * @param columnMetadata
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(
                      columnMetadata.transformer,
                      value,
                  )
                : value

        // the value of a jsonb column can be a JSON array, which is not an array column
        if (
            Array.isArray(value) &&
            (columnMetadata.type !== "jsonb" || columnMetadata.isArray)
        ) {
            value = value.map((item) =>
                item === null || item === undefined
                    ? item
                    : this.hydrateScalarValue(item, columnMetadata),
            )
        } else {
            value = this.hydrateScalarValue(value, columnMetadata)
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )

        return value
    }

    /**
     * Wraps the values of a WHERE condition, including those inside find
     * operators, so Spanner binds them with the type of the column.
     *
     * Spanner types a string parameter as `text` and, unlike PostgreSQL, does
     * not infer the type of the column it is compared with.
     *
     * @param column
     * @param value
     */
    parametrizeValues(column: ColumnMetadata, value: any): any {
        if (value instanceof FindOperator) {
            if (value.type !== "raw") {
                value.transformValue({
                    to: (v) => this.parametrizeValues(column, v),
                    from: (v) => v,
                })
            }

            return value
        }

        return this.prepareParameterValue(value, column, false)
    }

    /**
     * Casts a query parameter to the type of the column it is assigned to,
     * where Spanner cannot infer it from the bound value: `jsonb` values are
     * bound as JSON text.
     *
     * @param parameter
     * @param column
     */
    castParameter(parameter: string, column: ColumnMetadata): string {
        return column.type === "jsonb" && !column.isArray
            ? `${parameter}::jsonb`
            : parameter
    }

    /**
     * Gets the Spanner type given to an array parameter whose items cannot
     * tell it: the column type of an empty array, or of an array of nulls.
     *
     * @param value
     */
    getArrayItemType(value: any[]): string | ObjectLiteral | undefined {
        return this.arrayItemTypes.get(value)
    }

    /**
     * Converts a value read from Spanner to the plain value a query returns:
     * 64-bit integers are numbers, or strings when they are not safe integers;
     * `numeric` is a string; `date` is a `YYYY-MM-DD` string; `jsonb` is the
     * parsed JSON.
     *
     * @param value
     */
    normalizeRawValue(value: any): any {
        if (value === null || typeof value !== "object") return value

        const { Int, Float, Float32, PGNumeric, SpannerDate } = this.spannerLib

        if (value instanceof Int) {
            return Number.isSafeInteger(Number(value.value))
                ? Number(value.value)
                : value.value
        } else if (
            value instanceof Float ||
            (Float32 && value instanceof Float32)
        ) {
            return Number(value.value)
        } else if (value instanceof PGNumeric) {
            return value.value
        } else if (value instanceof SpannerDate) {
            return value.toJSON()
        } else if (value instanceof this.pgJsonbClass) {
            return value.value
        } else if (Array.isArray(value)) {
            return value.map((item) => this.normalizeRawValue(item))
        }

        return value
    }

    /**
     * Joins the results of the statements an INSERT was split into, keeping
     * the order of the returned rows.
     *
     * @param results
     */
    mergeQueryResults(results: QueryResult[]): QueryResult {
        const merged = new QueryResult()
        const records = results.flatMap((result) => result.records)
        const affected = results.reduce(
            (total, result) => total + (result.affected ?? 0),
            0,
        )
        const [, stats, metadata] = results[results.length - 1].raw

        merged.raw = [
            records,
            { ...stats, rowCountExact: affected.toString() },
            metadata,
        ]
        merged.records = records
        merged.affected = affected

        return merged
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     *
     * @param metadata
     * @param insertResult
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        if (!insertResult) {
            return undefined
        }

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key)
            if (column) {
                OrmUtils.mergeDeep(
                    map,
                    column.createValueMap(
                        this.prepareHydratedValue(insertResult[key], column),
                    ),
                )
            }
            return map
        }, {} as ObjectLiteral)
    }

    /**
     * Creates a database type from a given column metadata.
     *
     * The returned names are the ones Spanner reports in its information
     * schema, so a loaded column and its metadata compare equal. `text` and
     * `varchar` are the same type: Spanner stores both as `character varying`.
     *
     * @param column
     * @param column.type
     * @param column.length
     * @param column.precision
     * @param column.scale
     */
    normalizeType(column: {
        type: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        if (this.isInt64Type(column.type)) {
            return "bigint"
        } else if (
            column.type === String ||
            column.type === "uuid" ||
            column.type === "varchar" ||
            column.type === "character varying" ||
            column.type === "text" ||
            column.type === "simple-array" ||
            column.type === "simple-json"
        ) {
            return "character varying"
        } else if (
            column.type === Date ||
            column.type === "timestamptz" ||
            column.type === "timestamp with time zone"
        ) {
            return "timestamp with time zone"
        } else if (
            typeof column.type === "function" &&
            column.type.prototype instanceof Uint8Array
        ) {
            return "bytea"
        } else if (column.type === Boolean || column.type === "bool") {
            return "boolean"
        } else if (
            column.type === "float" ||
            column.type === "float8" ||
            column.type === "double precision"
        ) {
            return "double precision"
        } else if (column.type === "float4" || column.type === "real") {
            return "real"
        } else if (column.type === "decimal") {
            return "numeric"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Returns the length of a column, which only applies to `character varying`
     * columns: `text` and the types stored as text have none, and a `uuid` or
     * a generated uuid column is a `varchar(36)`.
     *
     * @param column
     */
    getColumnLength(column: ColumnMetadata | TableColumn): string {
        if (
            column.type === "text" ||
            column.type === "simple-array" ||
            column.type === "simple-json" ||
            this.normalizeType({ type: column.type as ColumnType }) !==
                "character varying"
        )
            return ""

        if (column.length) return column.length.toString()
        if (column.type === "uuid" || column.generationStrategy === "uuid")
            return "36"

        return ""
    }

    /**
     * Creates column type definition including the length.
     *
     * Spanner does not accept a precision or a scale in a DDL statement, not
     * even for `numeric`, so they are left out.
     *
     * @see https://cloud.google.com/spanner/docs/reference/postgresql/data-types
     * @param column
     */
    createFullType(column: TableColumn): string {
        let type = this.normalizeType({ type: column.type as ColumnType })
        const length = this.getColumnLength(column)

        if (length) type += `(${length})`
        if (column.isArray) type += "[]"

        return type
    }

    /**
     * Normalizes "default" value of the column to the SQL expression of its
     * DEFAULT clause: the SQL of a function, a quoted string or JSON, or a
     * number or boolean literal.
     *
     * @param columnMetadata
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (defaultValue === undefined || defaultValue === null) {
            return undefined
        } else if (typeof defaultValue === "function") {
            return defaultValue()
        } else if (
            typeof defaultValue === "number" ||
            typeof defaultValue === "bigint"
        ) {
            return `${defaultValue}`
        } else if (typeof defaultValue === "boolean") {
            return defaultValue ? "true" : "false"
        }

        const text =
            typeof defaultValue === "string"
                ? defaultValue
                : JSON.stringify(defaultValue)

        return `'${text.replaceAll("'", "''")}'`
    }

    /**
     * Converts the default value Spanner reports for a column to the
     * expression {@link normalizeDefault} gives for the same default: the casts
     * Spanner adds to a literal are removed (`'5'::bigint` is `5`,
     * `'abc'::text` is `'abc'`, `(1.5)::double precision` is `1.5`), and a
     * `NULL` default is no default.
     *
     * @param columnDefault
     */
    normalizeDatabaseDefault(
        columnDefault: string | null | undefined,
    ): string | undefined {
        if (columnDefault === null || columnDefault === undefined)
            return undefined

        const value = columnDefault.trim()

        if (/^NULL(?:::[a-z ]+)?$/i.test(value)) return undefined

        const quoted = /^('(?:[^']|'')*')(?:::([a-z][a-z ]*(?:\[\])*))?$/i.exec(
            value,
        )
        if (quoted) {
            const cast = quoted[2]?.toLowerCase()
            return cast &&
                ["bigint", "numeric", "real", "double precision"].includes(cast)
                ? quoted[1].slice(1, -1)
                : quoted[1]
        }

        const number = /^\((-?\d+(?:\.\d+)?)\)::[a-z ]+$/i.exec(value)
        if (number) return number[1]

        const negative = /^\(- '(\d+(?:\.\d+)?)'::[a-z ]+\)$/i.exec(value)
        if (negative) return `-${negative[1]}`

        return value
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     *
     * @param tableColumns
     * @param columnMetadatas
     */
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find(
                (c) => c.name === columnMetadata.databaseName,
            )
            if (!tableColumn) return false // we don't need new columns, we only need exist and changed

            return (
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== this.getColumnLength(columnMetadata) ||
                !!tableColumn.isArray !== !!columnMetadata.isArray ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                !this.compareNullableValues(columnMetadata, tableColumn) ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                !this.compareDefaultValues(
                    columnMetadata.isGenerated &&
                        columnMetadata.generationStrategy === "uuid"
                        ? this.uuidGenerationExpression
                        : this.normalizeDefault(columnMetadata),
                    this.getDefaultExpression(tableColumn),
                )
            )
        })
    }

    /**
     * Gets the SQL expression Spanner generates a uuid with.
     */
    get uuidGenerationExpression(): string {
        return "spanner.generate_uuid()"
    }

    /**
     * Cloud Spanner client library, used to build typed parameter values.
     */
    get spannerLib(): any {
        this.library ??=
            this.options.driver ?? PlatformTools.load("@google-cloud/spanner")
        return this.library
    }

    /**
     * Creates an escaped parameter.
     *
     * @param parameterName
     * @param index
     */
    createParameter(parameterName: string, index: number): string {
        return this.parametersPrefix + (index + 1)
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     *
     * A null parameter is written in the query as a NULL literal: Spanner needs
     * a type for every null parameter, and the one of the column it is compared
     * with or assigned to is unknown here.
     *
     * @param sql
     * @param parameters
     */
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
    ): [string, any[]] {
        const escapedParameters: any[] = []
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters]

        const parameterIndexMap = new Map<string, number>()
        sql = sql.replaceAll(
            /:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (full, isArray: string, key: string): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                if (parameterIndexMap.has(key)) {
                    return this.createParameter(
                        key,
                        parameterIndexMap.get(key)!,
                    )
                }

                const value: any = parameters[key]

                if (isArray) {
                    return value
                        .map((item: any) => {
                            if (item === null || item === undefined)
                                return "NULL"

                            escapedParameters.push(item)
                            return this.createParameter(
                                key,
                                escapedParameters.length - 1,
                            )
                        })
                        .join(", ")
                }

                if (typeof value === "function") {
                    return value()
                }

                if (value === null || value === undefined) {
                    return "NULL"
                }

                escapedParameters.push(value)
                parameterIndexMap.set(key, escapedParameters.length - 1)
                return this.createParameter(key, escapedParameters.length - 1)
            },
        )

        return [sql, escapedParameters]
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets the expression of the DEFAULT clause of a table column: the one that
     * generates a uuid for a generated uuid column, or its default value.
     *
     * @param column
     */
    getDefaultExpression(column: TableColumn): string | undefined {
        if (column.isGenerated && column.generationStrategy === "uuid")
            return this.uuidGenerationExpression

        return column.default === undefined || column.default === null
            ? undefined
            : String(column.default)
    }

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     * Numbers are compared by value, JSON by content and SQL expressions
     * ignoring case.
     *
     * @param columnMetadataValue
     * @param databaseValue
     */
    compareDefaultValues(
        columnMetadataValue: string | undefined,
        databaseValue: string | undefined,
    ): boolean {
        if (columnMetadataValue === databaseValue) return true
        if (
            typeof columnMetadataValue !== "string" ||
            typeof databaseValue !== "string"
        )
            return false

        const a = columnMetadataValue.trim()
        const b = databaseValue.trim()
        if (a.toLowerCase() === b.toLowerCase()) return true

        const unquote = (value: string) =>
            /^'.*'$/s.test(value)
                ? value.slice(1, -1).replaceAll("''", "'")
                : value
        const isNumber = (value: string) => /^-?\d+(\.\d+)?$/.test(value)
        if (isNumber(unquote(a)) && isNumber(unquote(b)))
            return Number(unquote(a)) === Number(unquote(b))

        if (a.startsWith("'") && b.startsWith("'")) {
            try {
                return (
                    JSON.stringify(JSON.parse(unquote(a))) ===
                    JSON.stringify(JSON.parse(unquote(b)))
                )
            } catch {
                return false
            }
        }

        return false
    }

    /**
     * Class of the `jsonb` values the client library returns. It is not
     * exported, so it is taken from an instance.
     */
    protected get pgJsonbClass(): any {
        this.jsonbClass ??= this.spannerLib.Spanner.pgJsonb(null).constructor
        return this.jsonbClass
    }

    /**
     * Converts a value to the typed parameter value Spanner binds for the
     * given column.
     *
     * @param value
     * @param column
     * @param forWrite true for an INSERT / UPDATE value, false for a WHERE one
     */
    protected prepareParameterValue(
        value: any,
        column: ColumnMetadata,
        forWrite: boolean,
    ): any {
        if (value === null || value === undefined) return value
        if (typeof value === "function") return value

        const type = column.type

        if (type === "jsonb") {
            if (!forWrite)
                throw new TypeORMError(
                    `Spanner cannot compare jsonb values, so the "${column.databaseName}" column cannot be filtered by value: use a raw condition with a JSON operator, such as @>.`,
                )

            if (column.isArray && Array.isArray(value)) {
                // Spanner cannot cast a text array to jsonb[], so the items are
                // JSON texts bound as an array of jsonb
                const items = value.map((item) =>
                    item === null || item === undefined
                        ? null
                        : JSON.stringify(item),
                )
                this.arrayItemTypes.set(items, { type: "jsonb" })
                return items
            }

            // jsonb is bound as JSON text, see castParameter()
            return JSON.stringify(value)
        } else if (type === "simple-array") {
            return DateUtils.simpleArrayToString(value)
        } else if (type === "simple-json") {
            return DateUtils.simpleJsonToString(value)
        }

        if (Array.isArray(value)) {
            const items = value.map((item) =>
                this.prepareParameterValue(item, column, forWrite),
            )
            if (!items.some((item) => item !== null && item !== undefined)) {
                // there is no item to infer the type of the array from
                this.arrayItemTypes.set(items, this.getSpannerType(type))
            }
            return items
        }

        const { Spanner } = this.spannerLib

        if (this.isInt64Type(type)) {
            if (typeof value === "bigint") {
                return Spanner.int(value.toString())
            } else if (
                typeof value === "string" &&
                /^-?\d+$/.test(value.trim())
            ) {
                return Spanner.int(value.trim())
            }
        } else if (
            type === "float" ||
            type === "float8" ||
            type === "double precision"
        ) {
            if (typeof value === "number") {
                return Spanner.float(value)
            } else if (typeof value === "string" && !isNaN(+value)) {
                return Spanner.float(+value)
            }
        } else if (type === "float4" || type === "real") {
            // a number is bound as float64, which Spanner does not coerce in arrays
            if (typeof value === "number") {
                return Spanner.float32(value)
            } else if (typeof value === "string" && !isNaN(+value)) {
                return Spanner.float32(+value)
            }
        } else if (type === "numeric" || type === "decimal") {
            return Spanner.pgNumeric(value.toString())
        } else if (type === "date") {
            // a typed DATE parameter, plain strings are not coerced to date
            return Spanner.date(
                DateUtils.mixedDateToDateString(value, {
                    utc: column.utc,
                }),
            )
        } else if (
            type === "timestamptz" ||
            type === "timestamp with time zone" ||
            type === Date
        ) {
            return DateUtils.mixedDateToDate(value)
        } else if (
            (type === "bytea" ||
                (typeof type === "function" &&
                    type.prototype instanceof Uint8Array)) &&
            isUint8Array(value) &&
            !Buffer.isBuffer(value)
        ) {
            return Buffer.from(value)
        }

        return value
    }

    /**
     * Converts a value read from the database to the value of an entity
     * property, based on its column type.
     *
     * @param value
     * @param columnMetadata
     */
    protected hydrateScalarValue(
        value: any,
        columnMetadata: ColumnMetadata,
    ): any {
        const type = columnMetadata.type
        value = this.normalizeRawValue(value)

        if (type === Boolean || type === "bool" || type === "boolean") {
            return value ? true : false
        } else if (
            type === "timestamptz" ||
            type === "timestamp with time zone" ||
            type === Date
        ) {
            return new Date(value)
        } else if (type === "date") {
            return DateUtils.mixedDateToDateString(value, {
                utc: columnMetadata.utc,
            })
        } else if (type === "numeric" || type === "decimal") {
            return value.toString()
        } else if (type === "bigint" || type === "int8") {
            // as the Postgres driver, hydrate the 64-bit integers as strings
            return this.parseInt8 ? Number(value) : value.toString()
        } else if (type === Number || type === "int" || type === "integer") {
            // a 64-bit integer that is not a safe integer is read as a string
            if (
                typeof value === "string" &&
                /^-?\d+$/.test(value) &&
                !Number.isSafeInteger(Number(value))
            )
                throw new TypeORMError(
                    `The value ${value} of the column "${columnMetadata.databaseName}" does not fit in a JavaScript number: declare the column as "bigint", which is read as a string.`,
                )

            // convert to number if number
            return !isNaN(+value) ? parseInt(value) : value
        } else if (type === "simple-array") {
            return DateUtils.stringToSimpleArray(value)
        } else if (type === "simple-json") {
            return DateUtils.stringToSimpleJson(value)
        }

        return value
    }

    /**
     * Gets the Spanner type a value of the given column type is bound as.
     *
     * @param type
     */
    protected getSpannerType(type: ColumnType): string | ObjectLiteral {
        if (this.isInt64Type(type)) {
            return "int64"
        } else if (
            type === "float" ||
            type === "float8" ||
            type === "double precision"
        ) {
            return "float64"
        } else if (type === "float4" || type === "real") {
            return "float32"
        } else if (type === "numeric" || type === "decimal") {
            return { type: "pgNumeric" }
        } else if (type === "date") {
            return "date"
        } else if (
            type === "timestamptz" ||
            type === "timestamp with time zone" ||
            type === Date
        ) {
            return "timestamp"
        } else if (type === Boolean || type === "bool" || type === "boolean") {
            return "bool"
        } else if (
            type === "bytea" ||
            (typeof type === "function" && type.prototype instanceof Uint8Array)
        ) {
            return "bytes"
        }

        return "string"
    }

    /**
     * Tells if the given column type is stored as a 64-bit integer, which are
     * all the integer types of Spanner.
     *
     * @param type
     */
    protected isInt64Type(type: ColumnType): boolean {
        return (
            type === Number ||
            type === "int" ||
            type === "integer" ||
            type === "int8" ||
            type === "bigint"
        )
    }
}
