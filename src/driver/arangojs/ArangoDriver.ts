import {Driver} from "../Driver";
import { Database } from 'arangojs'
import { ArangoConnectionOptions } from "./ArangoConnectionOptions";
import { Connection } from "../../connection/Connection";
import { ColumnType } from "../types/ColumnTypes";
import { MappedColumnTypes } from "../types/MappedColumnTypes";
import { DataTypeDefaults } from "../types/DataTypeDefaults";
import { PlatformTools } from "../../platform/PlatformTools";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { ConnectionIsNotSetError}  from "../../error/ConnectionIsNotSetError";
import { ArangoQueryRunner } from "./ArangoQueryRunner";
import { ArangoSchemaBuilder } from "../../schema-builder/ArangoSchemaBuilder";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";

// import {ObjectLiteral} from "../../common/ObjectLiteral";
// import {TableColumn} from "../../schema-builder/table/TableColumn";
// import {EntityMetadata} from "../../metadata/EntityMetadata";
// // import {ObjectUtils} from "../../util/ObjectUtils";

/**
 * Organizes communication with ArangoDB.
 */
export class ArangoDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Arangojs instance
     */
    arangojs: Database;

    /**
     * Mongodb does not require to dynamically create query runner each time,
     * because it does not have a regular connection pool as RDBMS systems have.
     */
    queryRunner?: ArangoQueryRunner;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: ArangoConnectionOptions;

    /**
     * Master database used to perform all write queries.
     */
    database?: string;

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false;

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = false;

    /**
     * Mongodb does not need to have column types because they are not used in schema sync.
     */
    supportedDataTypes: ColumnType[] = [];

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = [];

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [];

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [];

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = [];

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
    };

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;

    /**
     * No documentation specifying a maximum length for identifiers could be found
     * for MongoDB.
     */
    maxAliasLength?: number;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Valid mongo connection options
     * NOTE: Keep sync with MongoConnectionOptions
     * Sync with http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html
     */
    protected validOptionNames: string[] = [
        "poolSize",
        "ssl",
        "sslValidate",
        "sslCA",
        "sslCert",
        "sslKey",
        "sslPass",
        "sslCRL",
        "autoReconnect",
        "noDelay",
        "keepAlive",
        "keepAliveInitialDelay",
        "connectTimeoutMS",
        "family",
        "socketTimeoutMS",
        "reconnectTries",
        "reconnectInterval",
        "ha",
        "haInterval",
        "replicaSet",
        "secondaryAcceptableLatencyMS",
        "acceptableLatencyMS",
        "connectWithNoPrimary",
        "authSource",
        "w",
        "wtimeout",
        "j",
        "forceServerObjectId",
        "serializeFunctions",
        "ignoreUndefined",
        "raw",
        "bufferMaxEntries",
        "readPreference",
        "pkFactory",
        "promiseLibrary",
        "readConcern",
        "maxStalenessSeconds",
        "loggerLevel",
        // Do not overwrite BaseConnectionOptions.logger
        // "logger",
        "promoteValues",
        "promoteBuffers",
        "promoteLongs",
        "domainsEnabled",
        "checkServerIdentity",
        "validateOptions",
        "appname",
        // omit auth - we are building url from username and password
        // "auth"
        "authMechanism",
        "compression",
        "fsync",
        "readPreferenceTags",
        "numberOfRetries",
        "auto_reconnect",
        "minSize",
        "monitorCommands",
        "useNewUrlParser",
        "useUnifiedTopology"
    ];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
        this.options = connection.options as ArangoConnectionOptions;

        // validate options to make sure everything is correct and driver will be able to establish connection
        this.validateOptions(connection.options);

        // load arangojs package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            try {
                this.arangojs = new Database(this.options)
    
                if(this.options.database) {
                    this.arangojs.useDatabase(this.options.database)
                }
                if (this.options.username) {
                    this.arangojs.useBasicAuth(this.options.username, this.options.password || "")
                }
                if (this.options.token) {
                    this.arangojs.useBearerAuth(this.options.token)
                }
                return ok()
            } catch (error){ return fail(error)}
        });
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (!this.queryRunner)
                return fail(new ConnectionIsNotSetError("arangojs"));
            this.queryRunner.databaseConnection.close();
            this.queryRunner = undefined;
            return ok()
        });
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new ArangoSchemaBuilder(this.connection);
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master"|"slave" = "master") {
        return this.queryRunner!;
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: any, nativeParameters: any): [string, any[]] {
        throw new Error(`This operation is not supported by Arangodb driver.`);
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return columnName;
    }

    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column: ColumnMetadata): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Normalizes "default" value of the column.
     */
    createFullType(column: TableColumn): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertedId: any) {
        return metadata.objectIdColumn!.createValueMap(insertedId);
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return false;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return false;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "";
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     */
    protected validateOptions(options: any) {
        // Arangojs will connect using defaults is no configs are passed as arguments.

        if (options.database && options.isAbsolute) {
            console.warn(`Should not set "isAbsolute" to true if "database" is selected. See https://www.arangodb.com/docs/stable/drivers/js-reference-database.html#databaseusedatabase`)
        }
        // Not likely to happen, in case it does, let's warn that it is happening. 
        if (options.username && !options.password) {
            console.warn(`connecting to username ${options.username} without password`)
        }
        return
    }

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): any {
        try {
            this.arangojs = PlatformTools.load("arangojs");  // try to load native driver dynamically

        } catch (e) {
            throw new DriverPackageNotInstalledError("ArangoJS", "arangojs");
        }
    }

    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    protected buildConnectionUrl(): string {
        throw new Error('Not defined')
        // if (this.options.url)
        //     return this.options.url;

        // const credentialsUrlPart = (this.options.username && this.options.password)
        //     ? `${this.options.username}:${this.options.password}@`
        //     : "";

        // return `mongodb://${credentialsUrlPart}${this.options.host || "127.0.0.1"}:${this.options.port || "27017"}/${this.options.database}`;
    }

    /**
     * Build connection options from MongoConnectionOptions
     */
    protected buildConnectionOptions(): any {
        const mongoOptions: any = {};

        for (let index = 0; index < this.validOptionNames.length; index++) {
            const optionName = this.validOptionNames[index];

            if (this.options.extra && optionName in this.options.extra) {
                mongoOptions[optionName] = this.options.extra[optionName];
            } else if (optionName in this.options) {
                mongoOptions[optionName] = (this.options as any)[optionName];
            }
        }

        return mongoOptions;
    }

}
