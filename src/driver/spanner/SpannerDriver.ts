import { Driver, ReturningType } from "../Driver"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { SpannerQueryRunner } from "./SpannerQueryRunner"
import { ObjectLiteral } from "../../common/ObjectLiteral"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { DateUtils } from "../../util/DateUtils"
import { PlatformTools } from "../../platform/PlatformTools"
import { Connection } from "../../connection/Connection"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { SpannerConnectionOptions } from "./SpannerConnectionOptions"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ColumnType } from "../types/ColumnTypes"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { OrmUtils } from "../../util/OrmUtils"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { ReplicationMode } from "../types/ReplicationMode"
import { Table } from "../../schema-builder/table/Table"
import { View } from "../../schema-builder/view/View"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { CteCapabilities } from "../types/CteCapabilities"
import { UpsertType } from "../types/UpsertType"

/**
 * Organizes communication with Spanner DBMS.
 */
export class SpannerDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: Connection

    /**
     * Cloud Spanner underlying library.
     */
    spanner: any

    /**
     * Cloud Spanner instance.
     */
    instance: any

    /**
     * Cloud Spanner database.
     */
    instanceDatabase: any

    /**
     * Database name.
     */
    database?: string

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: SpannerConnectionOptions

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
    transactionSupport = "none" as const

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://cloud.google.com/spanner/docs/reference/standard-sql/data-types
     */
    supportedDataTypes: ColumnType[] = [
        "bool",
        "int64",
        "float64",
        "numeric",
        "string",
        "json",
        "bytes",
        "date",
        "timestamp",
        "array",
    ]

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[] = []

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = ["string", "bytes"]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withWidthColumnTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = []

    /**
     * Gets list of column data types that supports scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = []

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "",
        updateDate: "timestamp",
        updateDateDefault: "",
        deleteDate: "timestamp",
        deleteDateNullable: true,
        version: "int64",
        treeLevel: "int64",
        migrationId: "int64",
        migrationName: "string",
        migrationTimestamp: "int64",
        cacheId: "string",
        cacheIdentifier: "string",
        cacheTime: "int64",
        cacheDuration: "int64",
        cacheQuery: "string",
        cacheResult: "string",
        metadataType: "string",
        metadataDatabase: "string",
        metadataSchema: "string",
        metadataTable: "string",
        metadataName: "string",
        metadataValue: "string",
    }

    /**
     * The prefix used for the parameters
     */
    parametersPrefix: string = "@param"

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {}

    /**
     * Max length allowed by MySQL for aliases.
     * @see https://dev.mysql.com/doc/refman/5.5/en/identifiers.html
     */
    maxAliasLength = 63

    cteCapabilities: CteCapabilities = {
        enabled: true,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection
        this.options = connection.options as SpannerConnectionOptions
        this.isReplicated = this.options.replication ? true : false

        // load mysql package
        this.loadDependencies()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.instance = this.spanner.instance(this.options.instanceId)
        this.instanceDatabase = this.instance.database(this.options.databaseId)
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
        this.instanceDatabase.close()
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
        return new SpannerQueryRunner(this, mode)
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

                const value: any = parameters[key]

                if (value === null) {
                    return full
                }

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

                if (value instanceof Function) {
                    return value()
                }

                escapedParameters.push(value)
                parameterIndexMap.set(key, escapedParameters.length - 1)
                return this.createParameter(key, escapedParameters.length - 1)
            },
        ) // todo: make replace only in value statements, otherwise problems

        sql = sql.replace(
            /([ ]+)?=([ ]+)?:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (
                full,
                emptySpaceBefore: string,
                emptySpaceAfter: string,
                isArray: string,
                key: string,
            ): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                const value: any = parameters[key]
                if (value === null) {
                    return " IS NULL"
                }

                return full
            },
        )
        return [sql, escapedParameters]
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return `\`${columnName}\``
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

        if (target instanceof Table || target instanceof View) {
            const parsed = this.parseTableName(target.name)

            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (target instanceof TableForeignKey) {
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

        if (target instanceof EntityMetadata) {
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
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        if (value === null || value === undefined) return value

        if (columnMetadata.type === "numeric") {
            const lib = this.options.driver || PlatformTools.load("spanner")
            return lib.Spanner.numeric(value.toString())
        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "json") {
            return value
        } else if (
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === Date
        ) {
            return DateUtils.mixedDateToDate(value)
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

        if (columnMetadata.type === Boolean || columnMetadata.type === "bool") {
            value = value ? true : false
        } else if (
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === Date
        ) {
            value = new Date(value)
        } else if (columnMetadata.type === "numeric") {
            value = value.value
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value)
        } else if (columnMetadata.type === "json") {
            value = typeof value === "string" ? JSON.parse(value) : value
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
        if (column.type === Number) {
            return "int64"
        } else if (column.type === String || column.type === "uuid") {
            return "string"
        } else if (column.type === Date) {
            return "timestamp"
        } else if ((column.type as any) === Buffer) {
            return "bytes"
        } else if (column.type === Boolean) {
            return "bool"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Normalizes "default" value of the column.
     *
     * Spanner does not support default values.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        return columnMetadata.default === ""
            ? `"${columnMetadata.default}"`
            : `${columnMetadata.default}`
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
        if (column.generationStrategy === "uuid") return "36"

        switch (column.type) {
            case String:
            case "string":
            case "bytes":
                return "max"
            default:
                return ""
        }
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        // used 'getColumnLength()' method, because Spanner requires column length for `string` and `bytes` data types
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

        if (column.isArray) type = `array<${type}>`

        return type
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return this.instanceDatabase
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return this.instanceDatabase
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
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== this.getColumnLength(columnMetadata) ||
                tableColumn.asExpression !== columnMetadata.asExpression ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                !this.compareNullableValues(columnMetadata, tableColumn) ||
                tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)

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
            //         this.getColumnLength(columnMetadata),
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
            //         "isPrimary:",
            //         tableColumn.isPrimary,
            //         columnMetadata.isPrimary,
            //     )
            //     console.log(
            //         "isNullable:",
            //         tableColumn.isNullable,
            //         columnMetadata.isNullable,
            //     )
            //     console.log(
            //         "isUnique:",
            //         tableColumn.isUnique,
            //         this.normalizeIsUnique(columnMetadata),
            //     )
            //     console.log("==========================================")
            // }

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
        return this.parametersPrefix + index
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            const lib = this.options.driver || PlatformTools.load("spanner")
            this.spanner = new lib.Spanner({
                projectId: this.options.projectId,
            })
        } catch (e) {
            console.error(e)
            throw new DriverPackageNotInstalledError(
                "Spanner",
                "@google-cloud/spanner",
            )
        }
    }

    compareNullableValues(
        columnMetadata: ColumnMetadata,
        tableColumn: TableColumn,
    ): boolean {
        // Spanner does not support NULL/NOT NULL expressions for generated columns
        if (columnMetadata.generatedType) {
            return true
        }

        return columnMetadata.isNullable === tableColumn.isNullable
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
            return precision
                ? `CURRENT_TIMESTAMP${precision[0]}`
                : "CURRENT_TIMESTAMP"
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
}
