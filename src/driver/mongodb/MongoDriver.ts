import { Driver } from "../Driver"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { CteCapabilities } from "../types/CteCapabilities"
import { DriverCapabilities } from "../types/DriverCapabilities"
import { MongoQueryRunner } from "./MongoQueryRunner"
import { ObjectLiteral } from "../../common/ObjectLiteral"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { PlatformTools } from "../../platform/PlatformTools"
import { DataSource } from "../../data-source/DataSource"
import { MongoConnectionOptions } from "./MongoConnectionOptions"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ColumnType } from "../types/ColumnTypes"
import { MongoSchemaBuilder } from "../../schema-builder/MongoSchemaBuilder"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { DataSourceOptions } from "../../data-source/DataSourceOptions"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { ObjectUtils } from "../../util/ObjectUtils"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { ReplicationMode } from "../types/ReplicationMode"
import { DriverUtils } from "../DriverUtils"
import { TypeORMError } from "../../error"
import { Table } from "../../schema-builder/table/Table"
import { View } from "../../schema-builder/view/View"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { InstanceChecker } from "../../util/InstanceChecker"
import { UpsertType } from "../types/UpsertType"

/**
 * Organizes communication with MongoDB.
 */
export class MongoDriver implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Underlying mongodb library.
     */
    mongodb: any

    /**
     * Mongodb does not require to dynamically create query runner each time,
     * because it does not have a regular connection pool as RDBMS systems have.
     */
    queryRunner?: MongoQueryRunner

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: MongoConnectionOptions

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
    treeSupport = false

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "none" as const

    /**
     * Mongodb does not need to have column types because they are not used in schema sync.
     */
    supportedDataTypes: ColumnType[] = []

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[]

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = []

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = []

    /**
     * Mongodb does not need to have a strong defined mapped column types because they are not used in schema sync.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "int",
        createDateDefault: "",
        updateDate: "int",
        updateDateDefault: "",
        deleteDate: "int",
        deleteDateNullable: true,
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "int",
        migrationTimestamp: "int",
        cacheId: "int",
        cacheIdentifier: "int",
        cacheTime: "int",
        cacheDuration: "int",
        cacheQuery: "int",
        cacheResult: "int",
        metadataType: "int",
        metadataDatabase: "int",
        metadataSchema: "int",
        metadataTable: "int",
        metadataName: "int",
        metadataValue: "int",
    }

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults

    /**
     * No documentation specifying a maximum length for identifiers could be found
     * for MongoDB.
     */
    maxAliasLength?: number

    cteCapabilities: CteCapabilities = {
        enabled: false,
    }

    capabilities: DriverCapabilities = {
        // Dialect - MongoDB doesn't use SQL
        stringAggregation: null,
        pagination: null,
        useIndexHint: false,
        maxExecutionTimeHint: false,
        distinctOn: false,

        // Upsert - MongoDB has its own upsert mechanism
        upsertStyle: null,
        upsertConflictWhere: false,

        // Returning - MongoDB doesn't use RETURNING
        returningInsert: false,
        returningUpdate: false,
        returningDelete: false,
        returningStyle: null,
        returningRequiresInto: false,

        // Update/Delete
        limitInUpdate: false,
        limitInDelete: false,
        joinInUpdate: false,

        // Locking
        forUpdate: false,
        forShareStyle: null,
        forKeyShare: false,
        forNoKeyUpdate: false,
        skipLocked: false,
        nowait: false,
        lockOfTables: false,

        // CTE
        cteEnabled: false,
        cteRecursive: false,
        cteRequiresRecursiveKeyword: false,
        cteWritable: false,
        cteMaterializedHint: false,

        // DDL
        indexTypes: [],
        defaultIndexType: undefined,
        partialIndexes: false,
        expressionIndexes: false,

        // Column types
        requiresColumnLength: false,
        jsonColumnType: true, // MongoDB is document-based
        uuidColumnType: false,
        arrayColumnType: true,

        // Transactions
        transactionSupport: "none",
    }

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Valid mongo connection options
     * NOTE: Keep in sync with MongoConnectionOptions
     */
    protected validOptionNames: string[] = [
        "appName",
        "authMechanism",
        "authSource",
        "autoEncryption",
        "checkServerIdentity",
        "compressors",
        "connectTimeoutMS",
        "directConnection",
        "family",
        "forceServerObjectId",
        "ignoreUndefined",
        "keepAlive",
        "keepAliveInitialDelay",
        "localThresholdMS",
        "maxStalenessSeconds",
        "minPoolSize",
        "monitorCommands",
        "noDelay",
        "pkFactory",
        "promoteBuffers",
        "promoteLongs",
        "promoteValues",
        "raw",
        "readConcern",
        "readPreference",
        "readPreferenceTags",
        "replicaSet",
        "retryWrites",
        "serializeFunctions",
        "socketTimeoutMS",
        "ssl",
        "sslCA",
        "sslCRL",
        "sslCert",
        "sslKey",
        "sslPass",
        "sslValidate",
        "tls",
        "tlsAllowInvalidCertificates",
        "tlsCAFile",
        "tlsCertificateKeyFile",
        "tlsCertificateKeyFilePassword",
        "w",
        "writeConcern",
        "wtimeoutMS",
        // Proxy configuration for Socks5
        "proxyHost",
        "proxyPort",
        "proxyUsername",
        "proxyPassword",
        // Undocumented deprecated options
        // todo: remove next major version
        "appname",
        "fsync",
        "j",
        "useNewUrlParser",
        "useUnifiedTopology",
        "wtimeout",
    ]

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: DataSource) {
        this.options = connection.options as MongoConnectionOptions

        // validate options to make sure everything is correct and driver will be able to establish connection
        this.validateOptions(connection.options)

        // load mongodb package
        this.loadDependencies()

        this.database = DriverUtils.buildMongoDBDriverOptions(
            this.options,
        ).database
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        const options = DriverUtils.buildMongoDBDriverOptions(this.options)

        const client = await this.mongodb.MongoClient.connect(
            this.buildConnectionUrl(options),
            this.buildConnectionOptions(options),
        )

        this.queryRunner = new MongoQueryRunner(this.connection, client)
        ObjectUtils.assign(this.queryRunner, {
            manager: this.connection.manager,
        })
    }

    afterConnect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        const queryRunner = this.queryRunner
        if (!queryRunner) {
            throw new ConnectionIsNotSetError("mongodb")
        }

        this.queryRunner = undefined
        await queryRunner.databaseConnection.close()
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new MongoSchemaBuilder(this.connection)
    }

    /**
     * Creates a query runner used to execute database queries.
     * @param mode
     */
    createQueryRunner(mode: ReplicationMode) {
        return this.queryRunner!
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     * @param sql
     * @param parameters
     * @param nativeParameters
     */
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
        nativeParameters: ObjectLiteral,
    ): [string, any[]] {
        throw new TypeORMError(
            `This operation is not supported by Mongodb driver.`,
        )
    }

    /**
     * Escapes a column name.
     * @param columnName
     */
    escape(columnName: string): string {
        return columnName
    }

    /**
     * Build full table name with database name, schema name and table name.
     * E.g. myDB.mySchema.myTable
     * @param tableName
     * @param schema
     * @param database
     */
    buildTableName(
        tableName: string,
        schema?: string,
        database?: string,
    ): string {
        return tableName
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     * @param target
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { tableName: string; schema?: string; database?: string } {
        if (InstanceChecker.isEntityMetadata(target)) {
            return {
                tableName: target.tableName,
            }
        }

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            return {
                tableName: target.name,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            return {
                tableName: target.referencedTableName,
            }
        }

        return {
            tableName: target,
        }
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     * @param value
     * @param columnMetadata
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )
        return value
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     * @param value
     * @param columnMetadata
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )
        return value
    }

    /**
     * Creates a database type from a given column metadata.
     * @param column
     * @param column.type
     * @param column.length
     * @param column.precision
     * @param column.scale
     */
    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Normalizes "default" value of the column.
     * @param columnMetadata
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Normalizes "isUnique" value of the column.
     * @param column
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Calculates column length taking into account the default length values.
     * @param column
     */
    getColumnLength(column: ColumnMetadata): string {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Normalizes "default" value of the column.
     * @param column
     */
    createFullType(column: TableColumn): string {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return Promise.resolve()
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve()
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     * @param metadata
     * @param insertedId
     */
    createGeneratedMap(metadata: EntityMetadata, insertedId: any) {
        return metadata.objectIdColumn!.createValueMap(insertedId)
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     * @param tableColumns
     * @param columnMetadatas
     */
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        throw new TypeORMError(
            `MongoDB is schema-less, not supported by this driver.`,
        )
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return false
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
        return false
    }

    /**
     * Creates an escaped parameter.
     * @param parameterName
     * @param index
     */
    createParameter(parameterName: string, index: number): string {
        return ""
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     * @param options
     */
    protected validateOptions(options: DataSourceOptions) {
        // todo: fix
        // if (!options.url) {
        //     if (!options.database)
        //         throw new DriverOptionNotSetError("database");
        // }
    }

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): any {
        try {
            const mongodb = this.options.driver || PlatformTools.load("mongodb")
            this.mongodb = mongodb
        } catch (e) {
            throw new DriverPackageNotInstalledError("MongoDB", "mongodb")
        }
    }

    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    protected buildConnectionUrl(options: { [key: string]: any }): string {
        const schemaUrlPart = options.type.toLowerCase()
        const credentialsUrlPart =
            options.username && options.password
                ? `${encodeURIComponent(options.username)}:${encodeURIComponent(
                      options.password,
                  )}@`
                : ""

        const portUrlPart =
            schemaUrlPart === "mongodb+srv" ? "" : `:${options.port || "27017"}`

        let connectionString: string
        if (options.replicaSet) {
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${
                options.hostReplicaSet ||
                options.host + portUrlPart ||
                "127.0.0.1" + portUrlPart
            }/${options.database || ""}`
        } else {
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${
                options.host || "127.0.0.1"
            }${portUrlPart}/${options.database || ""}`
        }

        return connectionString
    }

    /**
     * Build connection options from MongoConnectionOptions
     */
    protected buildConnectionOptions(options: { [key: string]: any }): any {
        const mongoOptions: any = {}

        for (const optionName of this.validOptionNames) {
            if (optionName in options) {
                mongoOptions[optionName] = options[optionName]
            }
        }

        mongoOptions.driverInfo = {
            name: "TypeORM",
        }

        if ("poolSize" in options) {
            mongoOptions["maxPoolSize"] = options["poolSize"]
        }

        Object.assign(mongoOptions, options.extra)

        return mongoOptions
    }
}
