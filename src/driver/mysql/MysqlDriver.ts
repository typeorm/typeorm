import { ObjectLiteral } from "../../common/ObjectLiteral"
import { DataSource } from "../../data-source/DataSource"
import { TypeORMError } from "../../error"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { PlatformTools } from "../../platform/PlatformTools"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { View } from "../../schema-builder/view/View"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DateUtils } from "../../util/DateUtils"
import { InstanceChecker } from "../../util/InstanceChecker"
import { OrmUtils } from "../../util/OrmUtils"
import { VersionUtils } from "../../util/VersionUtils"
import { Driver, ReturningType } from "../Driver"
import { DriverUtils } from "../DriverUtils"
import { ColumnType, UnsignedColumnType } from "../types/ColumnTypes"
import { CteCapabilities } from "../types/CteCapabilities"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ReplicationMode } from "../types/ReplicationMode"
import { UpsertType } from "../types/UpsertType"
import { MysqlConnectionCredentialsOptions } from "./MysqlConnectionCredentialsOptions"
import { MysqlConnectionOptions } from "./MysqlConnectionOptions"
import { MysqlQueryRunner } from "./MysqlQueryRunner"

/**
 * Organizes communication with MySQL DBMS.
 */
export class MysqlDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: DataSource

    /**
     * Mysql underlying library.
     */
    mysql: any

    /**
     * Connection pool.
     * Used in non-replication mode.
     */
    pool: any

    /**
     * Pool cluster used in replication mode.
     */
    poolCluster: any

    /**
     * The actual connector package that was loaded ("mysql" or "mysql2").
     */
    private loadedConnectorPackage: "mysql" | "mysql2" | undefined

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: MysqlConnectionOptions

    /**
     * Version of MySQL. Requires a SQL query to the DB, so it is not always set
     */
    version?: string

    /**
     * Indicates if CHECK constraints are fully supported (MySQL >= 8.0.16).
     */
    isCheckConstraintsSupported: boolean = false

    /**
     * Master database used to perform all write queries.
     */
    database?: string

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
     * @see https://www.tutorialspoint.com/mysql/mysql-data-types.htm
     * @see https://dev.mysql.com/doc/refman/8.0/en/data-types.html
     */
    supportedDataTypes: ColumnType[] = [
        // numeric types
        "bit",
        "int",
        "integer", // synonym for int
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "float",
        "double",
        "double precision", // synonym for double
        "real", // synonym for double
        "decimal",
        "dec", // synonym for decimal
        "numeric", // synonym for decimal
        "fixed", // synonym for decimal
        "bool", // synonym for tinyint
        "boolean", // synonym for tinyint
        // date and time types
        "date",
        "datetime",
        "timestamp",
        "time",
        "year",
        // string types
        "char",
        "nchar", // synonym for national char
        "national char",
        "varchar",
        "nvarchar", // synonym for national varchar
        "national varchar",
        "blob",
        "text",
        "tinyblob",
        "tinytext",
        "mediumblob",
        "mediumtext",
        "longblob",
        "longtext",
        "enum",
        "set",
        "binary",
        "varbinary",
        // json data type
        "json",
        // spatial data types
        "geometry",
        "point",
        "linestring",
        "polygon",
        "multipoint",
        "multilinestring",
        "multipolygon",
        "geometrycollection",
        // additional data types for mariadb
        "uuid",
        "inet4",
        "inet6",
    ]

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[] = ["on-duplicate-key-update"]

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = [
        "geometry",
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
    withLengthColumnTypes: ColumnType[] = [
        "char",
        "varchar",
        "nvarchar",
        "binary",
        "varbinary",
    ]

    /**
     * Gets list of column data types that support the unsigned attribute by a driver.
     */
    unsignedColumnTypes: UnsignedColumnType[] = [
        "tinyint",
        "smallint",
        "mediumint",
        "int",
        "integer",
        "bigint",
    ]

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "dec",
        "numeric",
        "fixed",
        "float",
        "double",
        "double precision",
        "real",
        "time",
        "datetime",
        "timestamp",
    ]

    /**
     * Gets list of column data types that supports scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = [
        "decimal",
        "dec",
        "numeric",
        "fixed",
        "float",
        "double",
        "double precision",
        "real",
    ]

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDatePrecision: 6,
        createDateDefault: "CURRENT_TIMESTAMP(6)",
        updateDate: "datetime",
        updateDatePrecision: 6,
        updateDateDefault: "CURRENT_TIMESTAMP(6)",
        deleteDate: "datetime",
        deleteDatePrecision: 6,
        deleteDateNullable: true,
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
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
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        varchar: { length: 255 },
        nvarchar: { length: 255 },
        "national varchar": { length: 255 },
        char: { length: 1 },
        binary: { length: 1 },
        varbinary: { length: 255 },
        decimal: { precision: 10, scale: 0 },
        dec: { precision: 10, scale: 0 },
        numeric: { precision: 10, scale: 0 },
        fixed: { precision: 10, scale: 0 },
        float: { precision: 12 },
        double: { precision: 22 },
        time: { precision: 0 },
        datetime: { precision: 0 },
        timestamp: { precision: 0 },
        bit: { width: 1 },
        int: { width: 11 },
        integer: { width: 11 },
        tinyint: { width: 4 },
        smallint: { width: 6 },
        mediumint: { width: 9 },
        bigint: { width: 20 },
    }

    /**
     * Max length allowed by MySQL for aliases.
     * @see https://dev.mysql.com/doc/refman/5.5/en/identifiers.html
     */
    maxAliasLength = 63

    cteCapabilities: CteCapabilities = {
        enabled: false,
        requiresRecursiveHint: true,
    }

    /**
     * Supported returning types
     */
    private readonly _isReturningSqlSupported: Record<ReturningType, boolean> =
        {
            delete: false,
            insert: false,
            update: false,
        }

    /** MariaDB supports uuid type for version 10.7.0 and up */
    private uuidColumnTypeSuported = false

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        this.connection = connection
        this.options = {
            legacySpatialSupport: true,
            ...connection.options,
        } as MysqlConnectionOptions
        this.isReplicated = this.options.replication ? true : false

        // load mysql package
        this.loadDependencies()

        this.database = DriverUtils.buildDriverOptions(
            this.options.replication
                ? this.options.replication.master
                : this.options,
        ).database

        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!(this.options.host || (this.options.extra && this.options.extra.socketPath)) && !this.options.socketPath)
        //     throw new DriverOptionNotSetError("socketPath and host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
        // todo: check what is going on when connection is setup without database and how to connect to a database then?
        // todo: provide options to auto-create a database if it does not exist yet
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        if (this.options.replication) {
            this.poolCluster = this.mysql.createPoolCluster(
                this.options.replication,
            )
            this.options.replication.slaves.forEach((slave, index) => {
                this.poolCluster.add(
                    "SLAVE" + index,
                    this.createConnectionOptions(this.options, slave),
                )
            })
            this.poolCluster.add(
                "MASTER",
                this.createConnectionOptions(
                    this.options,
                    this.options.replication.master,
                ),
            )
        } else {
            this.pool = await this.createPool(
                this.createConnectionOptions(this.options, this.options),
            )
        }

        if (!this.database) {
            const queryRunner = this.createQueryRunner("master")

            this.database = await queryRunner.getCurrentDatabase()

            await queryRunner.release()
        }

        const queryRunner = this.createQueryRunner("master")
        this.version = await queryRunner.getVersion()
        await queryRunner.release()

        if (this.options.type === "mariadb") {
            if (VersionUtils.isGreaterOrEqual(this.version, "10.0.5")) {
                this._isReturningSqlSupported.delete = true
            }
            if (VersionUtils.isGreaterOrEqual(this.version, "10.5.0")) {
                this._isReturningSqlSupported.insert = true
            }
            if (VersionUtils.isGreaterOrEqual(this.version, "10.2.0")) {
                this.cteCapabilities.enabled = true
            }
            if (VersionUtils.isGreaterOrEqual(this.version, "10.7.0")) {
                this.uuidColumnTypeSuported = true
            }
        } else if (this.options.type === "mysql") {
            if (VersionUtils.isGreaterOrEqual(this.version, "8.0.0")) {
                this.cteCapabilities.enabled = true
            }
            if (VersionUtils.isGreaterOrEqual(this.version, "8.0.16")) {
                this.isCheckConstraintsSupported = true
            }
        }
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        if (!this.poolCluster && !this.pool) {
            throw new ConnectionIsNotSetError("mysql")
        }

        if (this.poolCluster) {
            return new Promise<void>((ok, fail) => {
                this.poolCluster.end((err: any) => (err ? fail(err) : ok()))
                this.poolCluster = undefined
            })
        }
        if (this.pool) {
            return new Promise<void>((ok, fail) => {
                this.pool.end((err: any) => {
                    if (err) return fail(err)
                    this.pool = undefined
                    ok()
                })
            })
        }
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
        return new MysqlQueryRunner(this, mode)
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

                const value: any = parameters[key]

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
                return this.createParameter(key, escapedParameters.length - 1)
            },
        ) // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters]
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return "`" + columnName + "`"
    }

    /**
     * Build full table name with database name, schema name and table name.
     * E.g. myDB.mySchema.myTable
     */
    buildTableName(
        tableName: string,
        schema?: string,
        database?: string,
    ): string {
        const tablePath = [tableName]

        if (database) {
            tablePath.unshift(database)
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
        const driverSchema = undefined

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed = this.parseTableName(target.name)

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
            // EntityMetadata tableName is never a path

            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")

        return {
            database:
                (parts.length > 1 ? parts[0] : undefined) || driverDatabase,
            schema: driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        }
    }

    /**
     * Checks if the driver is using mysql2 package.
     */
    protected isUsingMysql2(): boolean {
        // Check which package was actually loaded during initialization
        return this.loadedConnectorPackage === "mysql2"
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
        } else if (columnMetadata.type === "json") {
            return JSON.stringify(value)
        } else if (
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date
        ) {
            return DateUtils.mixedDateToDate(value)
        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value)
        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value)
        } else if (
            columnMetadata.type === "enum" ||
            columnMetadata.type === "simple-enum"
        ) {
            return "" + value
        } else if (columnMetadata.type === "set") {
            return DateUtils.simpleArrayToString(value)
        } else if (columnMetadata.type === Number) {
            // convert to number if number
            value = !isNaN(+value) ? parseInt(value) : value
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

        if (
            columnMetadata.type === Boolean ||
            columnMetadata.type === "bool" ||
            columnMetadata.type === "boolean"
        ) {
            value = value ? true : false
        } else if (
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date
        ) {
            value = DateUtils.normalizeHydratedDate(value)
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "json") {
            // mysql2 returns JSON values already parsed, but may still be a string
            // if the JSON value itself is a string (e.g., "\"hello\"")
            // mysql (classic) always returns JSON as strings that need parsing
            if (this.isUsingMysql2()) {
                // With mysql2, only parse if it's a valid JSON string representation
                // but not if it's already an object or a JSON primitive
                if (typeof value === "string") {
                    try {
                        // Try to parse it - if it fails, it's already a parsed string value
                        const parsed = JSON.parse(value)
                        value = parsed
                    } catch {
                        // It's a string that's not valid JSON, which means mysql2
                        // already parsed it and it's just a string value
                        // Keep value as is
                    }
                }
                // If it's not a string, mysql2 has already parsed it correctly
            } else {
                // Classic mysql always returns JSON as strings
                value = typeof value === "string" ? JSON.parse(value) : value
            }
        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value)
        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value)
        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value)
        } else if (
            (columnMetadata.type === "enum" ||
                columnMetadata.type === "simple-enum") &&
            columnMetadata.enum &&
            !isNaN(value) &&
            columnMetadata.enum.indexOf(parseInt(value)) >= 0
        ) {
            // convert to number if that exists in possible enum options
            value = parseInt(value)
        } else if (columnMetadata.type === "set") {
            value = DateUtils.stringToSimpleArray(value)
        } else if (columnMetadata.type === Number) {
            // convert to number if number
            value = !isNaN(+value) ? parseInt(value) : value
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
        type: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        if (column.type === Number || column.type === "integer") {
            return "int"
        } else if (column.type === String) {
            return "varchar"
        } else if (column.type === Date) {
            return "datetime"
        } else if ((column.type as any) === Buffer) {
            return "blob"
        } else if (column.type === Boolean) {
            return "tinyint"
        } else if (column.type === "uuid" && !this.uuidColumnTypeSuported) {
            return "varchar"
        } else if (
            column.type === "json" &&
            this.options.type === "mariadb" &&
            !VersionUtils.isGreaterOrEqual(this.version, "10.4.3")
        ) {
            /*
             * MariaDB implements this as a LONGTEXT rather, as the JSON data type contradicts the SQL standard,
             * and MariaDB's benchmarks indicate that performance is at least equivalent.
             *
             * @see https://mariadb.com/kb/en/json-data-type/
             * if Version is 10.4.3 or greater, JSON is an alias for longtext and an automatic check_json(column) constraint is added
             */
            return "longtext"
        } else if (
            column.type === "simple-array" ||
            column.type === "simple-json"
        ) {
            return "text"
        } else if (column.type === "simple-enum") {
            return "enum"
        } else if (
            column.type === "double precision" ||
            column.type === "real"
        ) {
            return "double"
        } else if (
            column.type === "dec" ||
            column.type === "numeric" ||
            column.type === "fixed"
        ) {
            return "decimal"
        } else if (column.type === "bool" || column.type === "boolean") {
            return "tinyint"
        } else if (
            column.type === "nvarchar" ||
            column.type === "national varchar"
        ) {
            return "varchar"
        } else if (column.type === "nchar" || column.type === "national char") {
            return "char"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (defaultValue === null) {
            return undefined
        }

        if (
            (columnMetadata.type === "enum" ||
                columnMetadata.type === "simple-enum" ||
                typeof defaultValue === "string") &&
            defaultValue !== undefined
        ) {
            return `'${defaultValue}'`
        }

        if (columnMetadata.type === "set" && defaultValue !== undefined) {
            return `'${DateUtils.simpleArrayToString(defaultValue)}'`
        }

        if (typeof defaultValue === "number") {
            return `'${defaultValue.toFixed(columnMetadata.scale)}'`
        }

        if (typeof defaultValue === "boolean") {
            return defaultValue ? "1" : "0"
        }

        if (typeof defaultValue === "function") {
            const value = defaultValue()
            return this.normalizeDatetimeFunction(value)
        }

        if (defaultValue === undefined) {
            return undefined
        }

        return `${defaultValue}`
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.indices.some(
            (idx) =>
                idx.isUnique &&
                idx.columns.length === 1 &&
                idx.columns[0] === column,
        )
    }

    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column: ColumnMetadata | TableColumn): string {
        if (column.length) return column.length.toString()

        /**
         * fix https://github.com/typeorm/typeorm/issues/1139
         * note that if the db did support uuid column type it wouldn't have been defaulted to varchar
         */
        if (
            column.generationStrategy === "uuid" &&
            !this.uuidColumnTypeSuported
        )
            return "36"

        switch (column.type) {
            case String:
            case "varchar":
            case "nvarchar":
            case "national varchar":
                return "255"
            case "varbinary":
                return "255"
            default:
                return ""
        }
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        // used 'getColumnLength()' method, because MySQL requires column length for `varchar`, `nvarchar` and `varbinary` data types
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`
        } else if (column.width) {
            type += `(${column.width})`
        } else if (
            column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined
        ) {
            type += `(${column.precision},${column.scale})`
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
            if (this.poolCluster) {
                this.poolCluster.getConnection(
                    "MASTER",
                    (err: any, dbConnection: any) => {
                        err
                            ? fail(err)
                            : ok(this.prepareDbConnection(dbConnection))
                    },
                )
            } else if (this.pool) {
                this.pool.getConnection((err: any, dbConnection: any) => {
                    err ? fail(err) : ok(this.prepareDbConnection(dbConnection))
                })
            } else {
                fail(
                    new TypeORMError(
                        `Connection is not established with mysql database`,
                    ),
                )
            }
        })
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        if (!this.poolCluster) return this.obtainMasterConnection()

        return new Promise<any>((ok, fail) => {
            this.poolCluster.getConnection(
                "SLAVE*",
                (err: any, dbConnection: any) => {
                    err ? fail(err) : ok(this.prepareDbConnection(dbConnection))
                },
            )
        })
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(
        metadata: EntityMetadata,
        insertResult: any,
        entityIndex: number,
    ) {
        if (!insertResult) {
            return undefined
        }

        if (insertResult.insertId === undefined) {
            return Object.keys(insertResult).reduce((map, key) => {
                const column = metadata.findColumnWithDatabaseName(key)
                if (column) {
                    OrmUtils.mergeDeep(
                        map,
                        column.createValueMap(insertResult[key]),
                    )
                    // OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column))); // TODO: probably should be like there, but fails on enums, fix later
                }
                return map
            }, {} as ObjectLiteral)
        }

        const generatedMap = metadata.generatedColumns.reduce(
            (map, generatedColumn) => {
                let value: any
                if (
                    generatedColumn.generationStrategy === "increment" &&
                    insertResult.insertId
                ) {
                    // NOTE: When multiple rows is inserted by a single INSERT statement,
                    // `insertId` is the value generated for the first inserted row only.
                    value = insertResult.insertId + entityIndex
                    // } else if (generatedColumn.generationStrategy === "uuid") {
                    //     console.log("getting db value:", generatedColumn.databaseName);
                    //     value = generatedColumn.getEntityValue(uuidMap);
                }

                return OrmUtils.mergeDeep(
                    map,
                    generatedColumn.createValueMap(value),
                )
            },
            {} as ObjectLiteral,
        )

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined
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

            const isColumnChanged =
                tableColumn.name !== columnMetadata.databaseName ||
                this.isColumnDataTypeChanged(tableColumn, columnMetadata) ||
                tableColumn.length !== this.getColumnLength(columnMetadata) ||
                tableColumn.width !== columnMetadata.width ||
                (columnMetadata.precision !== undefined &&
                    tableColumn.precision !== columnMetadata.precision) ||
                (columnMetadata.scale !== undefined &&
                    tableColumn.scale !== columnMetadata.scale) ||
                tableColumn.zerofill !== columnMetadata.zerofill ||
                tableColumn.unsigned !== columnMetadata.unsigned ||
                tableColumn.asExpression !== columnMetadata.asExpression ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                tableColumn.comment !==
                    this.escapeComment(columnMetadata.comment) ||
                !this.compareDefaultValues(
                    this.normalizeDefault(columnMetadata),
                    tableColumn.default,
                ) ||
                (tableColumn.enum &&
                    columnMetadata.enum &&
                    !OrmUtils.isArraysEqual(
                        tableColumn.enum,
                        columnMetadata.enum.map((val) => val + ""),
                    )) ||
                tableColumn.onUpdate !==
                    this.normalizeDatetimeFunction(columnMetadata.onUpdate) ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                !this.compareNullableValues(columnMetadata, tableColumn) ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                (columnMetadata.generationStrategy !== "uuid" &&
                    tableColumn.isGenerated !== columnMetadata.isGenerated)

            // DEBUG SECTION
            // if (isColumnChanged) {
            //     console.log("table:", columnMetadata.entityMetadata.tableName)
            //     console.log(
            //         "name:",
            //         tableColumn.name,
            //         columnMetadata.databaseName,
            //     )
            //     console.log(
            //         "type:",
            //         tableColumn.type,
            //         this.normalizeType(columnMetadata),
            //     )
            //     console.log(
            //         "length:",
            //         tableColumn.length,
            //         columnMetadata.length,
            //     )
            //     console.log("width:", tableColumn.width, columnMetadata.width)
            //     console.log(
            //         "precision:",
            //         tableColumn.precision,
            //         columnMetadata.precision,
            //     )
            //     console.log("scale:", tableColumn.scale, columnMetadata.scale)
            //     console.log(
            //         "zerofill:",
            //         tableColumn.zerofill,
            //         columnMetadata.zerofill,
            //     )
            //     console.log(
            //         "unsigned:",
            //         tableColumn.unsigned,
            //         columnMetadata.unsigned,
            //     )
            //     console.log(
            //         "asExpression:",
            //         tableColumn.asExpression,
            //         columnMetadata.asExpression,
            //     )
            //     console.log(
            //         "generatedType:",
            //         tableColumn.generatedType,
            //         columnMetadata.generatedType,
            //     )
            //     console.log(
            //         "comment:",
            //         tableColumn.comment,
            //         this.escapeComment(columnMetadata.comment),
            //     )
            //     console.log(
            //         "default:",
            //         tableColumn.default,
            //         this.normalizeDefault(columnMetadata),
            //     )
            //     console.log("enum:", tableColumn.enum, columnMetadata.enum)
            //     console.log(
            //         "default changed:",
            //         !this.compareDefaultValues(
            //             this.normalizeDefault(columnMetadata),
            //             tableColumn.default,
            //         ),
            //     )
            //     console.log(
            //         "isPrimary:",
            //         tableColumn.isPrimary,
            //         columnMetadata.isPrimary,
            //     )
            //     console.log(
            //         "isNullable changed:",
            //         !this.compareNullableValues(columnMetadata, tableColumn),
            //     )
            //     console.log(
            //         "isUnique:",
            //         tableColumn.isUnique,
            //         this.normalizeIsUnique(columnMetadata),
            //     )
            //     console.log(
            //         "isGenerated:",
            //         tableColumn.isGenerated,
            //         columnMetadata.isGenerated,
            //     )
            //     console.log(
            //         columnMetadata.generationStrategy !== "uuid" &&
            //             tableColumn.isGenerated !== columnMetadata.isGenerated,
            //     )
            //     console.log("==========================================")
            // }

            return isColumnChanged
        })
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(returningType: ReturningType): boolean {
        return this._isReturningSqlSupported[returningType]
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return false
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return true
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "?"
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        // Warn if driver is provided directly but connectorPackage is not specified
        if (this.options.driver && !this.options.connectorPackage) {
            console.warn(
                "Warning: MySQL driver instance provided directly without specifying connectorPackage. " +
                    "This may lead to unexpected JSON parsing behavior differences between mysql and mysql2. " +
                    "Consider explicitly setting connectorPackage: 'mysql' or 'mysql2' in your configuration.",
            )
        }

        const connectorPackage = this.options.connectorPackage ?? "mysql"
        const fallbackConnectorPackage =
            connectorPackage === "mysql"
                ? ("mysql2" as const)
                : ("mysql" as const)
        try {
            // try to load first supported package
            const mysql =
                this.options.driver || PlatformTools.load(connectorPackage)
            this.mysql = mysql
            /*
             * Some frameworks (such as Jest) may mess up Node's require cache and provide garbage for the 'mysql' module
             * if it was not installed. We check that the object we got actually contains something otherwise we treat
             * it as if the `require` call failed.
             *
             * @see https://github.com/typeorm/typeorm/issues/1373
             */
            if (Object.keys(this.mysql).length === 0) {
                throw new TypeORMError(
                    `'${connectorPackage}' was found but it is empty. Falling back to '${fallbackConnectorPackage}'.`,
                )
            }
            // Successfully loaded the requested package
            // If driver was provided directly, try to detect which package it is
            if (this.options.driver && !this.options.connectorPackage) {
                // Try to detect if it's mysql2 based on unique properties
                if (
                    this.mysql.version ||
                    (this.mysql.Connection &&
                        this.mysql.Connection.prototype.execute)
                ) {
                    this.loadedConnectorPackage = "mysql2"
                } else {
                    this.loadedConnectorPackage = "mysql"
                }
            } else {
                this.loadedConnectorPackage = connectorPackage
            }
        } catch (e) {
            try {
                this.mysql = PlatformTools.load(fallbackConnectorPackage) // try to load second supported package
                // Successfully loaded the fallback package
                this.loadedConnectorPackage = fallbackConnectorPackage
            } catch (e) {
                throw new DriverPackageNotInstalledError(
                    "Mysql",
                    connectorPackage,
                )
            }
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected createConnectionOptions(
        options: MysqlConnectionOptions,
        credentials: MysqlConnectionCredentialsOptions,
    ): Promise<any> {
        credentials = Object.assign(
            {},
            credentials,
            DriverUtils.buildDriverOptions(credentials),
        ) // todo: do it better way

        // build connection options for the driver
        return Object.assign(
            {},
            {
                charset: options.charset,
                timezone: options.timezone,
                connectTimeout: options.connectTimeout,
                insecureAuth: options.insecureAuth,
                supportBigNumbers:
                    options.supportBigNumbers !== undefined
                        ? options.supportBigNumbers
                        : true,
                bigNumberStrings:
                    options.bigNumberStrings !== undefined
                        ? options.bigNumberStrings
                        : true,
                dateStrings: options.dateStrings,
                debug: options.debug,
                trace: options.trace,
                multipleStatements: options.multipleStatements,
                flags: options.flags,
                stringifyObjects: true,
            },
            {
                host: credentials.host,
                user: credentials.username,
                password: credentials.password,
                database: credentials.database,
                port: credentials.port,
                ssl: options.ssl,
                socketPath: credentials.socketPath,
                connectionLimit: options.poolSize,
            },
            options.acquireTimeout === undefined
                ? {}
                : { acquireTimeout: options.acquireTimeout },
            options.extra || {},
        )
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected createPool(connectionOptions: any): Promise<any> {
        // create a connection pool
        const pool = this.mysql.createPool(connectionOptions)

        // make sure connection is working fine
        return new Promise<void>((ok, fail) => {
            // (issue #610) we make first connection to database to make sure if connection credentials are wrong
            // we give error before calling any other method that creates actual query runner
            pool.getConnection((err: any, connection: any) => {
                if (err) return pool.end(() => fail(err))

                connection.release()
                ok(pool)
            })
        })
    }

    /**
     * Attaches all required base handlers to a database connection, such as the unhandled error handler.
     */
    private prepareDbConnection(connection: any): any {
        const { logger } = this.connection
        /*
         * Attaching an error handler to connection errors is essential, as, otherwise, errors raised will go unhandled and
         * cause the hosting app to crash.
         */
        if (connection.listeners("error").length === 0) {
            connection.on("error", (error: any) =>
                logger.log(
                    "warn",
                    `MySQL connection raised an error. ${error}`,
                ),
            )
        }
        return connection
    }

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    protected compareDefaultValues(
        columnMetadataValue: string | undefined,
        databaseValue: string | undefined,
    ): boolean {
        if (
            typeof columnMetadataValue === "string" &&
            typeof databaseValue === "string"
        ) {
            // we need to cut out "'" because in mysql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "")
            databaseValue = databaseValue.replace(/^'+|'+$/g, "")
        }

        return columnMetadataValue === databaseValue
    }

    compareNullableValues(
        columnMetadata: ColumnMetadata,
        tableColumn: TableColumn,
    ): boolean {
        // MariaDB does not support NULL/NOT NULL expressions for generated columns
        const isMariaDb = this.options.type === "mariadb"
        if (isMariaDb && columnMetadata.generatedType) {
            return true
        }

        return columnMetadata.isNullable === tableColumn.isNullable
    }

    /**
     * If parameter is a datetime function, e.g. "CURRENT_TIMESTAMP", normalizes it.
     * Otherwise returns original input.
     */
    protected normalizeDatetimeFunction(value?: string) {
        if (!value) return value

        // check if input is datetime function
        const isDatetimeFunction =
            value.toUpperCase().indexOf("CURRENT_TIMESTAMP") !== -1 ||
            value.toUpperCase().indexOf("NOW") !== -1

        if (isDatetimeFunction) {
            // extract precision, e.g. "(3)"
            const precision = value.match(/\(\d+\)/)
            if (this.options.type === "mariadb") {
                return precision
                    ? `CURRENT_TIMESTAMP${precision[0]}`
                    : "CURRENT_TIMESTAMP()"
            } else {
                return precision
                    ? `CURRENT_TIMESTAMP${precision[0]}`
                    : "CURRENT_TIMESTAMP"
            }
        } else {
            return value
        }
    }

    /**
     * Escapes a given comment.
     */
    protected escapeComment(comment?: string) {
        if (!comment) return comment

        comment = comment.replace(/\u0000/g, "") // Null bytes aren't allowed in comments

        return comment
    }

    /**
     * A helper to check if column data types have changed
     * This can be used to manage checking any types the
     * database may alias
     */
    private isColumnDataTypeChanged(
        tableColumn: TableColumn,
        columnMetadata: ColumnMetadata,
    ) {
        // this is an exception for mariadb versions where json is an alias for longtext
        if (
            this.normalizeType(columnMetadata) === "json" &&
            tableColumn.type.toLowerCase() === "longtext"
        )
            return false
        return tableColumn.type !== this.normalizeType(columnMetadata)
    }
}
