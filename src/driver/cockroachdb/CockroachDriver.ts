import { ObjectLiteral } from "../../common/ObjectLiteral"
import { DataSource } from "../../data-source/DataSource"
import { TypeORMError } from "../../error"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { PlatformTools } from "../../platform/PlatformTools"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { View } from "../../schema-builder/view/View"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DateUtils } from "../../util/DateUtils"
import { InstanceChecker } from "../../util/InstanceChecker"
import { ObjectUtils } from "../../util/ObjectUtils"
import { OrmUtils } from "../../util/OrmUtils"
import { Driver } from "../Driver"
import { DriverUtils } from "../DriverUtils"
import { ColumnType } from "../types/ColumnTypes"
import { CteCapabilities } from "../types/CteCapabilities"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ReplicationMode } from "../types/ReplicationMode"
import { UpsertType } from "../types/UpsertType"
import { CockroachConnectionCredentialsOptions } from "./CockroachConnectionCredentialsOptions"
import { CockroachConnectionOptions } from "./CockroachConnectionOptions"
import { CockroachQueryRunner } from "./CockroachQueryRunner"

/**
 * Organizes communication with Cockroach DBMS.
 */
export class CockroachDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: DataSource

    /**
     * Cockroach underlying library.
     */
    postgres: any

    /**
     * Pool for master database.
     */
    master: any

    /**
     * Pool for slave databases.
     * Used in replication.
     */
    slaves: any[] = []

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
    options: CockroachConnectionOptions

    /**
     * Database name used to perform all write queries.
     */
    database?: string

    /**
     * Schema name used to perform all write queries.
     */
    schema?: string

    /**
     * Schema that's used internally by Postgres for object resolution.
     *
     * Because we never set this we have to track it in separately from the `schema` so
     * we know when we have to specify the full schema or not.
     *
     * In most cases this will be `public`.
     */
    searchSchema?: string

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
     *
     * @see https://www.cockroachlabs.com/docs/stable/data-types.html
     */
    supportedDataTypes: ColumnType[] = [
        "array",
        "bool",
        "boolean",
        "bytes",
        "bytea",
        "blob",
        "date",
        "enum",
        "geometry",
        "geography",
        "numeric",
        "decimal",
        "dec",
        "float",
        "float4",
        "float8",
        "double precision",
        "real",
        "inet",
        "int",
        "int4",
        "integer",
        "int2",
        "int8",
        "int64",
        "smallint",
        "bigint",
        "interval",
        "string",
        "character varying",
        "character",
        "char",
        "char varying",
        "varchar",
        "text",
        "time",
        "time without time zone",
        "timestamp",
        "timestamptz",
        "timestamp without time zone",
        "timestamp with time zone",
        "json",
        "jsonb",
        "uuid",
    ]

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[] = [
        "on-conflict-do-update",
        "primary-key",
    ]

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = ["geometry", "geography"]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "character varying",
        "char varying",
        "varchar",
        "character",
        "char",
        "string",
    ]

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = ["numeric", "decimal", "dec"]

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = ["numeric", "decimal", "dec"]

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamptz",
        createDateDefault: "now()",
        updateDate: "timestamptz",
        updateDateDefault: "now()",
        deleteDate: "timestamptz",
        deleteDateNullable: true,
        version: Number,
        treeLevel: Number,
        migrationId: Number,
        migrationName: "varchar",
        migrationTimestamp: "int8",
        cacheId: Number,
        cacheIdentifier: "varchar",
        cacheTime: "int8",
        cacheDuration: Number,
        cacheQuery: "string",
        cacheResult: "string",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "string",
    }

    /**
     * The prefix used for the parameters
     */
    parametersPrefix: string = "$"

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        char: { length: 1 },
    }

    /**
     * No documentation specifying a maximum length for identifiers could be found
     * for CockroarchDb.
     */
    maxAliasLength?: number

    cteCapabilities: CteCapabilities = {
        enabled: true,
        writable: true,
        materializedHint: true,
        requiresRecursiveHint: true,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        this.connection = connection
        this.options = connection.options as CockroachConnectionOptions
        this.isReplicated = this.options.replication ? true : false

        // load postgres package
        this.loadDependencies()

        this.database = DriverUtils.buildDriverOptions(
            this.options.replication
                ? this.options.replication.master
                : this.options,
        ).database
        this.schema = DriverUtils.buildDriverOptions(this.options).schema

        // ObjectUtils.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {
        if (this.options.replication) {
            this.slaves = await Promise.all(
                this.options.replication.slaves.map((slave) => {
                    return this.createPool(this.options, slave)
                }),
            )
            this.master = await this.createPool(
                this.options,
                this.options.replication.master,
            )
        } else {
            this.master = await this.createPool(this.options, this.options)
        }

        if (!this.database || !this.searchSchema) {
            const queryRunner = await this.createQueryRunner("master")

            if (!this.database) {
                this.database = await queryRunner.getCurrentDatabase()
            }

            if (!this.searchSchema) {
                this.searchSchema = await queryRunner.getCurrentSchema()
            }

            await queryRunner.release()
        }

        if (!this.schema) {
            this.schema = this.searchSchema
        }
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect(): Promise<void> {
        // enable time travel queries
        if (this.options.timeTravelQueries) {
            await this.connection.query(
                `SET default_transaction_use_follower_reads = 'on';`,
            )
        }

        // enable experimental alter column type support (we need it to alter enum types)
        await this.connection.query(
            "SET enable_experimental_alter_column_type_general = true",
        )

        return Promise.resolve()
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        if (!this.master)
            return Promise.reject(new ConnectionIsNotSetError("cockroachdb"))

        await this.closePool(this.master)
        await Promise.all(this.slaves.map((slave) => this.closePool(slave)))
        this.master = undefined
        this.slaves = []
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
    createQueryRunner(mode: ReplicationMode) {
        return new CockroachQueryRunner(this, mode)
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
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone"
        ) {
            return DateUtils.mixedDateToDate(value)
        } else if (
            ["json", "jsonb", ...this.spatialTypes].indexOf(
                columnMetadata.type,
            ) >= 0
        ) {
            return JSON.stringify(value)
        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value)
        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value)
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

        // unique_rowid() generates bigint value and should not be converted to number
        if (
            ([Number, "int4", "smallint", "int2"].some(
                (v) => v === columnMetadata.type,
            ) &&
                !columnMetadata.isArray) ||
            columnMetadata.generationStrategy === "increment"
        ) {
            value = parseInt(value)
        } else if (columnMetadata.type === Boolean) {
            value = value ? true : false
        } else if (
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone"
        ) {
            value = DateUtils.normalizeHydratedDate(value)
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value)
        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value)
        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value)
        } else if (
            columnMetadata.type === "enum" ||
            columnMetadata.type === "simple-enum"
        ) {
            if (columnMetadata.isArray) {
                if (value === "{}") return []
                if (Array.isArray(value)) return value

                // manually convert enum array to array of values (pg does not support, see https://github.com/brianc/node-pg-types/issues/56)
                value = (value as string)
                    .substr(1, (value as string).length - 2)
                    .split(",")
                    .map((val) => {
                        // replace double quotes from the beginning and from the end
                        if (val.startsWith(`"`) && val.endsWith(`"`))
                            val = val.slice(1, -1)
                        // replace double escaped backslash to single escaped e.g. \\\\ -> \\
                        val = val.replace(/(\\\\)/g, "\\")
                        // replace escaped double quotes to non-escaped e.g. \"asd\" -> "asd"
                        return val.replace(/(\\")/g, '"')
                    })

                // convert to number if that exists in possible enum options
                value = value.map((val: string) => {
                    return !isNaN(+val) &&
                        columnMetadata.enum!.indexOf(parseInt(val)) >= 0
                        ? parseInt(val)
                        : val
                })
            } else {
                // convert to number if that exists in possible enum options
                value =
                    !isNaN(+value) &&
                    columnMetadata.enum!.indexOf(parseInt(value)) >= 0
                        ? parseInt(value)
                        : value
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

        const parameterIndexMap = new Map<string, number>()
        sql = sql.replace(
            /:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (full, isArray: string, key: string): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                if (parameterIndexMap.has(key)) {
                    return this.parametersPrefix + parameterIndexMap.get(key)
                }

                let value: any = parameters[key]

                if (isArray) {
                    return value
                        .map((v: any) => {
                            escapedParameters.push(v)
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

                escapedParameters.push(value)
                parameterIndexMap.set(key, escapedParameters.length)
                return this.createParameter(key, escapedParameters.length - 1)
            },
        ) // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters]
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return '"' + columnName + '"'
    }

    /**
     * Build full table name with schema name and table name.
     * E.g. myDB.mySchema.myTable
     */
    buildTableName(tableName: string, schema?: string): string {
        let tablePath = [tableName]

        if (schema) {
            tablePath.unshift(schema)
        }

        return tablePath.join(".")
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
            // name is sometimes a path
            const parsed = this.parseTableName(target.name)

            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            // referencedTableName is sometimes a path
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
            // EntityMetadata tableName is never a path

            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")

        return {
            database: driverDatabase,
            schema: (parts.length > 1 ? parts[0] : undefined) || driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        }
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
        isArray?: boolean
        isGenerated?: boolean
        generationStrategy?:
            | "increment"
            | "uuid"
            | "rowid"
            | ((row:ObjectLiteral) => string | number)
    }): string {
        if (
            column.type === Number ||
            column.type === "integer" ||
            column.type === "int" ||
            column.type === "bigint" ||
            column.type === "int64"
        ) {
            return "int8"
        } else if (
            column.type === String ||
            column.type === "character varying" ||
            column.type === "char varying"
        ) {
            return "varchar"
        } else if (
            column.type === Date ||
            column.type === "timestamp without time zone"
        ) {
            return "timestamp"
        } else if (column.type === "timestamp with time zone") {
            return "timestamptz"
        } else if (column.type === "time without time zone") {
            return "time"
        } else if (column.type === Boolean || column.type === "boolean") {
            return "bool"
        } else if (
            column.type === "simple-array" ||
            column.type === "simple-json" ||
            column.type === "text"
        ) {
            return "string"
        } else if (column.type === "bytea" || column.type === "blob") {
            return "bytes"
        } else if (column.type === "smallint") {
            return "int2"
        } else if (column.type === "numeric" || column.type === "dec") {
            return "decimal"
        } else if (
            column.type === "double precision" ||
            column.type === "float"
        ) {
            return "float8"
        } else if (column.type === "real") {
            return "float4"
        } else if (column.type === "character") {
            return "char"
        } else if (column.type === "simple-enum") {
            return "enum"
        } else if (column.type === "json") {
            return "jsonb"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (defaultValue === undefined || defaultValue === null) {
            return undefined
        }

        if (
            (columnMetadata.type === "enum" ||
                columnMetadata.type === "simple-enum") &&
            defaultValue !== undefined
        ) {
            if (columnMetadata.isArray) {
                const enumName = this.buildEnumName(columnMetadata)
                let arrayValue = defaultValue
                if (typeof defaultValue === "string") {
                    if (defaultValue === "{}") return `ARRAY[]::${enumName}[]`
                    arrayValue = defaultValue
                        .replace("{", "")
                        .replace("}", "")
                        .split(",")
                }
                if (Array.isArray(arrayValue)) {
                    const expr = `ARRAY[${arrayValue
                        .map((it) => `'${it}'`)
                        .join(",")}]`
                    return `${expr}::${enumName}[]`
                }
            } else {
                return `'${defaultValue}'`
            }
        } else if (typeof defaultValue === "number") {
            return `(${defaultValue})`
        }

        if (typeof defaultValue === "boolean") {
            return defaultValue ? "true" : "false"
        }

        if (typeof defaultValue === "function") {
            const value = defaultValue()
            if (value.toUpperCase() === "CURRENT_TIMESTAMP") {
                return "current_timestamp()"
            } else if (value.toUpperCase() === "CURRENT_DATE") {
                return "current_date()"
            }
            return value
        }

        if (typeof defaultValue === "string") {
            const arrayCast = columnMetadata.isArray
                ? `::${columnMetadata.type}[]`
                : ""
            return `'${defaultValue}'${arrayCast}`
        }

        if (ObjectUtils.isObject(defaultValue) && defaultValue !== null) {
            return `'${JSON.stringify(defaultValue)}'`
        }

        return `${defaultValue}`
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
    getColumnLength(column: ColumnMetadata): string {
        return column.length ? column.length.toString() : ""
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        if (column.length) {
            type += "(" + column.length + ")"
        } else if (
            column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined
        ) {
            type += "(" + column.precision + "," + column.scale + ")"
        } else if (
            column.precision !== null &&
            column.precision !== undefined
        ) {
            type += "(" + column.precision + ")"
        } else if (this.spatialTypes.indexOf(column.type as ColumnType) >= 0) {
            if (column.spatialFeatureType != null && column.srid != null) {
                type = `${column.type}(${column.spatialFeatureType},${column.srid})`
            } else if (column.spatialFeatureType != null) {
                type = `${column.type}(${column.spatialFeatureType})`
            } else {
                type = column.type
            }
        }

        if (column.isArray) type += " array"

        return type
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    async obtainMasterConnection(): Promise<any> {
        if (!this.master) {
            throw new TypeORMError("Driver not Connected")
        }

        return new Promise((ok, fail) => {
            this.master.connect((err: any, connection: any, release: any) => {
                err ? fail(err) : ok([connection, release])
            })
        })
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    async obtainSlaveConnection(): Promise<any> {
        if (!this.slaves.length) return this.obtainMasterConnection()

        const random = Math.floor(Math.random() * this.slaves.length)

        return new Promise((ok, fail) => {
            this.slaves[random].connect(
                (err: any, connection: any, release: any) => {
                    err ? fail(err) : ok([connection, release])
                },
            )
        })
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     *
     * todo: slow. optimize Object.keys(), OrmUtils.mergeDeep and column.createValueMap parts
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult) return undefined

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
            if (!tableColumn) return false // we don't need new columns, we only need exist and changed

            // console.log("table:", columnMetadata.entityMetadata.tableName)
            // console.log("name:", {
            //     tableColumn: tableColumn.name,
            //     columnMetadata: columnMetadata.databaseName,
            // })
            // console.log("type:", {
            //     tableColumn: tableColumn.type,
            //     columnMetadata: this.normalizeType(columnMetadata),
            // })
            // console.log("length:", {
            //     tableColumn: tableColumn.length,
            //     columnMetadata: columnMetadata.length,
            // })
            // console.log("width:", tableColumn.width, columnMetadata.width);
            // console.log("precision:", tableColumn.precision, columnMetadata.precision);
            // console.log("scale:", tableColumn.scale, columnMetadata.scale);
            // console.log("comment:", tableColumn.comment, this.escapeComment(columnMetadata.comment));
            // console.log("default:", tableColumn.default, columnMetadata.default);
            // console.log("default changed:", !this.compareDefaultValues(this.normalizeDefault(columnMetadata), tableColumn.default));
            // console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            // console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            // console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            // console.log("asExpression:", {
            //     tableColumn: (tableColumn.asExpression || "").trim(),
            //     columnMetadata: (columnMetadata.asExpression || "").trim(),
            // })
            // console.log("==========================================");

            return (
                tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== columnMetadata.length ||
                tableColumn.isArray !== columnMetadata.isArray ||
                tableColumn.precision !== columnMetadata.precision ||
                (columnMetadata.scale !== undefined &&
                    tableColumn.scale !== columnMetadata.scale) ||
                tableColumn.comment !==
                    this.escapeComment(columnMetadata.comment) ||
                (!tableColumn.isGenerated &&
                    this.lowerDefaultValueIfNecessary(
                        this.normalizeDefault(columnMetadata),
                    ) !== tableColumn.default) || // we included check for generated here, because generated columns already can have default values
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                tableColumn.isNullable !== columnMetadata.isNullable ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                tableColumn.enumName !== columnMetadata.enumName ||
                (tableColumn.enum &&
                    columnMetadata.enum &&
                    !OrmUtils.isArraysEqual(
                        tableColumn.enum,
                        columnMetadata.enum.map((val) => val + ""),
                    )) || // enums in postgres are always strings
                tableColumn.isGenerated !== columnMetadata.isGenerated ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                (tableColumn.asExpression || "").trim() !==
                    (columnMetadata.asExpression || "").trim() ||
                (tableColumn.spatialFeatureType || "").toLowerCase() !==
                    (columnMetadata.spatialFeatureType || "").toLowerCase() ||
                tableColumn.srid !== columnMetadata.srid
            )
        })
    }

    private lowerDefaultValueIfNecessary(value: string | undefined) {
        if (!value) {
            return value
        }
        return value
            .split(`'`)
            .map((v, i) => {
                return i % 2 === 1 ? v : v.toLowerCase()
            })
            .join(`'`)
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
        return this.parametersPrefix + (index + 1)
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads postgres query stream package.
     */
    loadStreamDependency() {
        try {
            return PlatformTools.load("pg-query-stream")
        } catch (e) {
            // todo: better error for browser env
            throw new TypeORMError(
                `To use streams you should install pg-query-stream package. Please run npm i pg-query-stream --save command.`,
            )
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            const postgres = this.options.driver || PlatformTools.load("pg")
            this.postgres = postgres
            try {
                const pgNative =
                    this.options.nativeDriver || PlatformTools.load("pg-native")
                if (pgNative && this.postgres.native)
                    this.postgres = this.postgres.native
            } catch (e) {}
        } catch (e) {
            // todo: better error for browser env
            throw new DriverPackageNotInstalledError("Postgres", "pg")
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected async createPool(
        options: CockroachConnectionOptions,
        credentials: CockroachConnectionCredentialsOptions,
    ): Promise<any> {
        credentials = Object.assign(
            {},
            credentials,
            DriverUtils.buildDriverOptions(credentials),
        ) // todo: do it better way

        // build connection options for the driver
        const connectionOptions = Object.assign(
            {},
            {
                host: credentials.host,
                user: credentials.username,
                password: credentials.password,
                database: credentials.database,
                port: credentials.port,
                ssl: credentials.ssl,
                application_name: options.applicationName,
                max: options.poolSize,
            },
            options.extra || {},
        )

        // create a connection pool
        const pool = new this.postgres.Pool(connectionOptions)
        const { logger } = this.connection

        const poolErrorHandler =
            options.poolErrorHandler ||
            ((error: any) =>
                logger.log("warn", `Postgres pool raised an error. ${error}`))

        /*
          Attaching an error handler to pool errors is essential, as, otherwise, errors raised will go unhandled and
          cause the hosting app to crash.
         */
        pool.on("error", poolErrorHandler)

        return new Promise((ok, fail) => {
            pool.connect((err: any, connection: any, release: Function) => {
                if (err) return fail(err)
                release()
                ok(pool)
            })
        })
    }

    /**
     * Closes connection pool.
     */
    protected async closePool(pool: any): Promise<void> {
        await Promise.all(
            this.connectedQueryRunners.map((queryRunner) =>
                queryRunner.release(),
            ),
        )
        return new Promise<void>((ok, fail) => {
            pool.end((err: any) => (err ? fail(err) : ok()))
        })
    }

    /**
     * Escapes a given comment.
     */
    protected escapeComment(comment?: string) {
        if (!comment) return comment

        comment = comment.replace(/'/g, "''").replace(/\u0000/g, "") // Null bytes aren't allowed in comments

        return comment
    }

    /**
     * Builds ENUM type name from given table and column.
     */
    protected buildEnumName(column: ColumnMetadata): string {
        const { schema, tableName } = this.parseTableName(column.entityMetadata)
        let enumName = column.enumName
            ? column.enumName
            : `${tableName}_${column.databaseName.toLowerCase()}_enum`
        if (schema) enumName = `${schema}.${enumName}`
        return enumName
            .split(".")
            .map((i) => {
                return `"${i}"`
            })
            .join(".")
    }
}
