import { ObjectLiteral } from "../../common/ObjectLiteral"
import { DataSource } from "../../data-source/DataSource"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { PlatformTools } from "../../platform/PlatformTools"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DateUtils } from "../../util/DateUtils"
import { Driver } from "../Driver"
import { ColumnType } from "../types/ColumnTypes"
import { CteCapabilities } from "../types/CteCapabilities"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ReplicationMode } from "../types/ReplicationMode"
import { UpsertType } from "../types/UpsertType"
import { DuckDBConnectionOptions } from "./DuckDBConnectionOptions"
import { DuckDBQueryRunner } from "./DuckDBQueryRunner"
import { Table } from "../../schema-builder/table/Table"
import { View } from "../../schema-builder/view/View"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { InstanceChecker } from "../../util/InstanceChecker"

/**
 * Organizes communication with DuckDB DBMS.
 */
export class DuckDBDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: DataSource

    /**
     * DuckDB underlying library.
     */
    duckdb: any

    /**
     * DuckDB database connection.
     */
    databaseConnection: any

    /**
     * We store all created query runners because we need to release them.
     */
    connectedQueryRunners: QueryRunner[] = []

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: DuckDBConnectionOptions

    /**
     * Version of DuckDB.
     */
    version?: string

    /**
     * Database name used to perform all write queries.
     */
    database?: string

    /**
     * Schema name used to perform all write queries.
     */
    schema?: string

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "nested" as const

    /**
     * Gets list of supported column data types by a driver.
     */
    supportedDataTypes: ColumnType[] = [
        "boolean",
        "tinyint",
        "smallint",
        "integer",
        "bigint",
        "real",
        "double",
        "decimal",
        "varchar",
        "text",
        "blob",
        "date",
        "time",
        "timestamp",
        "timestamptz",
        "interval",
        "uuid",
        "json",
        "array",
    ]

    /**
     * Gets list of supported upsert types by a driver.
     */
    supportedUpsertTypes: UpsertType[] = ["on-conflict-do-update"]

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = [
        "geometry",
        "geography",
        "point",
        "linestring",
        "polygon",
        "multipoint",
        "multilinestring",
        "multipolygon",
        "geometrycollection",
    ]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = ["varchar", "decimal"]

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "time",
        "timestamp",
        "timestamptz",
    ]

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = ["decimal"]

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "timestamp",
        updateDateDefault: "CURRENT_TIMESTAMP",
        deleteDate: "timestamp",
        deleteDateNullable: true,
        version: "integer",
        treeLevel: "integer",
        migrationId: "integer",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "varchar",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "integer",
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
     * Default values of length, precision and scale depends on column data type.
     */
    dataTypeDefaults: DataTypeDefaults = {
        varchar: { length: 255 },
        decimal: { precision: 10, scale: 0 },
    }

    /**
     * Max length allowed by DuckDB for aliases.
     */
    maxAliasLength = 63

    cteCapabilities: CteCapabilities = {
        enabled: true,
        requiresRecursiveHint: true,
        materializedHint: true,
        writable: false,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        this.connection = connection
        this.options = connection.options as DuckDBConnectionOptions
        this.database = this.options.database
        this.loadDependencies()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection()
    }

    /**
     * Makes any action after connection (e.g. create extensions, install functions, etc.).
     */
    async afterConnect(): Promise<void> {
        // DuckDB might need extension loading or configuration setup
        if (this.options.config) {
            for (const [key, value] of Object.entries(this.options.config)) {
                if (
                    key !== "max_memory" &&
                    key !== "threads" &&
                    typeof value !== "object"
                ) {
                    await this.query(`SET ${key} = ${this.escape(value)}`)
                }
            }
        }
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        if (!this.databaseConnection) return

        this.connectedQueryRunners.forEach((queryRunner) => {
            const duckdbQueryRunner = queryRunner as any
            if (duckdbQueryRunner.databaseConnection) {
                duckdbQueryRunner.databaseConnection.close()
            }
        })

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.close((err: any) => {
                if (err) fail(err)
                else ok()
            })
        })
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection)
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode?: ReplicationMode): DuckDBQueryRunner {
        return new DuckDBQueryRunner(this, mode)
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
        nativeParameters: ObjectLiteral,
    ): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(
            (key) => nativeParameters[key],
        )
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters]

        sql = sql.replace(
            /:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (full, isArray: string, key: string): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                let value: any = parameters[key]

                if (isArray) {
                    return value
                        .map((v: any) => {
                            escapedParameters.push(v)
                            return `$${escapedParameters.length}`
                        })
                        .join(", ")
                }

                if (typeof value === "function") {
                    return value()
                }

                escapedParameters.push(value)
                return `$${escapedParameters.length}`
            },
        )
        return [sql, escapedParameters]
    }

    /**
     * Escape a table name.
     */
    escape(name: string): string {
        return `"${name}"`
    }

    /**
     * Build full table name with database name, schema name and table name.
     */
    buildTableName(
        tableName: string,
        schema?: string,
        database?: string,
    ): string {
        let result = tableName

        if (schema) {
            result = `${schema}.${result}`
        }

        if (database) {
            result = `${database}.${result}`
        }

        return result
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { database?: string; schema?: string; tableName: string } {
        const driverDatabase = this.database
        const driverSchema = this.schema

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed: {
                database?: string
                schema?: string
                tableName: string
            } = this.parseTableName(target.name)

            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            const parsed = this.parseTableName(target.referencedTableName)

            return {
                database:
                    target.referencedDatabase ||
                    parsed.database ||
                    driverDatabase,
                schema:
                    target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isEntityMetadata(target)) {
            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")
        return {
            database:
                (parts.length > 2 ? parts[0] : undefined) || driverDatabase,
            schema:
                (parts.length > 2
                    ? parts[1]
                    : parts.length > 1
                    ? parts[0]
                    : undefined) || driverSchema,
            tableName:
                parts.length > 2
                    ? parts[2]
                    : parts.length > 1
                    ? parts[1]
                    : parts[0],
        }
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        if (value === null || value === undefined) return value

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0
        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value)
        } else if (
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === Date
        ) {
            return DateUtils.mixedDateToDate(value)
        } else if (
            ["json", "jsonb", "array", "struct", "map"].indexOf(
                columnMetadata.type as string,
            ) >= 0
        ) {
            return JSON.stringify(value)
        }

        return value
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(
                      columnMetadata.transformer,
                      value,
                  )
                : value

        if (columnMetadata.type === Boolean) {
            value = value ? true : false
        } else if (
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === Date
        ) {
            value = DateUtils.normalizeHydratedDate(value)
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedDateToTimeString(value)
        } else if (
            ["json", "jsonb", "array", "struct", "map"].indexOf(
                columnMetadata.type as string,
            ) >= 0
        ) {
            if (typeof value === "string") {
                try {
                    value = JSON.parse(value)
                } catch (error) {
                    // Handle parsing errors gracefully
                }
            }
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )

        return value
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
        array?: boolean
    }): string {
        if (column.type === Number || column.type === "integer") {
            return "integer"
        } else if (column.type === String || column.type === "varchar") {
            return "varchar" + (column.length ? `(${column.length})` : "")
        } else if (column.type === Date || column.type === "timestamp") {
            return (
                "timestamp" + (column.precision ? `(${column.precision})` : "")
            )
        } else if (column.type === "timestamptz") {
            return (
                "timestamptz" +
                (column.precision ? `(${column.precision})` : "")
            )
        } else if (column.type === Boolean || column.type === "boolean") {
            return "boolean"
        } else if (column.type === "decimal") {
            if (column.precision && column.scale) {
                return `decimal(${column.precision},${column.scale})`
            } else if (column.precision) {
                return `decimal(${column.precision})`
            }
            return "decimal"
        } else if ((column.type as any) === Buffer) {
            return "blob"
        } else if (column.type === "uuid") {
            return "uuid"
        } else if (column.type === "json") {
            return "json"
        }

        return (column.type as string) || ""
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (typeof defaultValue === "number") {
            return `${defaultValue}`
        } else if (typeof defaultValue === "boolean") {
            return defaultValue ? "true" : "false"
        } else if (typeof defaultValue === "function") {
            const value = defaultValue()
            return this.normalizeDefault({
                ...columnMetadata,
                default: value,
            } as ColumnMetadata)
        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`
        } else if (defaultValue === null || defaultValue === undefined) {
            return undefined
        } else if (typeof defaultValue === "object" && defaultValue !== null) {
            return `${defaultValue}`
        } else {
            return `${defaultValue}`
        }
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(
            (uq) => uq.columns.length === 1 && uq.columns[0] === column,
        )
    }

    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column: ColumnMetadata | TableColumn): string {
        if (column.length) return column.length.toString()

        const columnType = (column as any).type
        switch (columnType) {
            case String:
            case "varchar":
                return "255"
            case "uuid":
                return "36"
            default:
                return ""
        }
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`
        } else if (
            column.width ||
            (column.precision !== null &&
                column.precision !== undefined &&
                column.scale !== null &&
                column.scale !== undefined)
        ) {
            type += `(${column.precision || column.width},${column.scale || 0})`
        } else if (
            column.precision !== null &&
            column.precision !== undefined
        ) {
            type += `(${column.precision})`
        }

        if (column.isArray) type += " array"

        return type
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return new Promise<any>((ok, fail) => {
            if (this.databaseConnection) {
                return ok(this.databaseConnection)
            }
            fail(new ConnectionIsNotSetError("duckdb"))
        })
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return this.obtainMasterConnection()
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(
        metadata: EntityMetadata,
        insertResult: ObjectLiteral,
        entityIndex: number,
    ) {
        return {}
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find(
                (c) => c.name === columnMetadata.databaseName,
            )
            if (!tableColumn) return false

            const isColumnChanged =
                tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                (tableColumn.length || "").toString() !==
                    (columnMetadata.length || "").toString() ||
                tableColumn.precision !== columnMetadata.precision ||
                tableColumn.scale !== columnMetadata.scale ||
                tableColumn.default !== columnMetadata.default ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                tableColumn.isNullable !== columnMetadata.isNullable ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                tableColumn.isGenerated !== columnMetadata.isGenerated

            return isColumnChanged
        })
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return true
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return true
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return false
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return `$${index + 1}`
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            const duckdbPackage =
                this.options.driver || PlatformTools.load("@duckdb/node-api")
            this.duckdb = duckdbPackage
        } catch (e) {
            throw new DriverPackageNotInstalledError(
                "DuckDB",
                "@duckdb/node-api",
            )
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected async createDatabaseConnection(): Promise<any> {
        const { database, config, readOnly, accessMode } = this.options

        return new Promise((ok, fail) => {
            const options: any = {}

            if (config) {
                Object.assign(options, config)
            }

            if (readOnly !== undefined) {
                options.access_mode = readOnly ? "read_only" : "read_write"
            } else if (accessMode) {
                options.access_mode = accessMode
            }

            const connection = new this.duckdb.Database(
                database,
                options,
                (err: any) => {
                    if (err) return fail(err)
                    ok(connection)
                },
            )
        })
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected async query(sql: string, parameters?: any[]): Promise<any> {
        return new Promise((ok, fail) => {
            this.databaseConnection.all(
                sql,
                parameters || [],
                (err: any, result: any) => {
                    if (err) return fail(err)
                    ok(result)
                },
            )
        })
    }
}
