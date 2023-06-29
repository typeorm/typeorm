import { __awaiter } from "tslib";
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { MongoQueryRunner } from "./MongoQueryRunner";
import { PlatformTools } from "../../platform/PlatformTools";
import { MongoSchemaBuilder } from "../../schema-builder/MongoSchemaBuilder";
import { ObjectUtils } from "../../util/ObjectUtils";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";
import { DriverUtils } from "../DriverUtils";
/**
 * Organizes communication with MongoDB.
 */
export class MongoDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
        /**
         * Indicates if replication is enabled.
         */
        this.isReplicated = false;
        /**
         * Indicates if tree tables are supported by this driver.
         */
        this.treeSupport = false;
        /**
         * Mongodb does not need to have column types because they are not used in schema sync.
         */
        this.supportedDataTypes = [];
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = [];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = [];
        /**
         * Gets list of column data types that support scale by a driver.
         */
        this.withScaleColumnTypes = [];
        /**
         * Mongodb does not need to have a strong defined mapped column types because they are not used in schema sync.
         */
        this.mappedDataTypes = {
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
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * Valid mongo connection options
         * NOTE: Keep sync with MongoConnectionOptions
         * Sync with http://mongodb.github.io/node-mongodb-native/3.5/api/MongoClient.html
         */
        this.validOptionNames = [
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
            "useUnifiedTopology",
            "autoEncryption"
        ];
        this.options = connection.options;
        // validate options to make sure everything is correct and driver will be able to establish connection
        this.validateOptions(connection.options);
        // load mongodb package
        this.loadDependencies();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    connect() {
        return new Promise((ok, fail) => {
            const options = DriverUtils.buildMongoDBDriverOptions(this.options);
            this.mongodb.MongoClient.connect(this.buildConnectionUrl(options), this.buildConnectionOptions(options), (err, client) => {
                if (err)
                    return fail(err);
                this.queryRunner = new MongoQueryRunner(this.connection, client);
                ObjectUtils.assign(this.queryRunner, { manager: this.connection.manager });
                ok();
            });
        });
    }
    afterConnect() {
        return Promise.resolve();
    }
    /**
     * Closes connection with the database.
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                if (!this.queryRunner)
                    return fail(new ConnectionIsNotSetError("mongodb"));
                const handler = (err) => err ? fail(err) : ok();
                this.queryRunner.databaseConnection.close(handler);
                this.queryRunner = undefined;
            });
        });
    }
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new MongoSchemaBuilder(this.connection);
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        return this.queryRunner;
    }
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql, parameters, nativeParameters) {
        throw new Error(`This operation is not supported by Mongodb driver.`);
    }
    /**
     * Escapes a column name.
     */
    escape(columnName) {
        return columnName;
    }
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    buildTableName(tableName, schema, database) {
        return tableName;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "default" value of the column.
     */
    createFullType(column) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection() {
        return Promise.resolve();
    }
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection() {
        return Promise.resolve();
    }
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata, insertedId) {
        return metadata.objectIdColumn.createValueMap(insertedId);
    }
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns, columnMetadatas) {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported() {
        return false;
    }
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported() {
        return false;
    }
    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported() {
        return false;
    }
    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName, index) {
        return "";
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     */
    validateOptions(options) {
        // if (!options.url) {
        //     if (!options.database)
        //         throw new DriverOptionNotSetError("database");
        // }
    }
    /**
     * Loads all driver dependencies.
     */
    loadDependencies() {
        try {
            this.mongodb = PlatformTools.load("mongodb"); // try to load native driver dynamically
        }
        catch (e) {
            throw new DriverPackageNotInstalledError("MongoDB", "mongodb");
        }
    }
    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    buildConnectionUrl(options) {
        const schemaUrlPart = options.type.toLowerCase();
        const credentialsUrlPart = (options.username && options.password)
            ? `${options.username}:${options.password}@`
            : "";
        let connectionString = undefined;
        if (options.replicaSet) {
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${options.hostReplicaSet}/${options.database || ""}`;
        }
        else {
            const portUrlPart = (schemaUrlPart === "mongodb+srv")
                ? ""
                : `:${options.port || "27017"}`;
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${options.host || "127.0.0.1"}${portUrlPart}/${options.database || ""}`;
        }
        return connectionString;
    }
    /**
     * Build connection options from MongoConnectionOptions
     */
    buildConnectionOptions(options) {
        const mongoOptions = {};
        for (let index = 0; index < this.validOptionNames.length; index++) {
            const optionName = this.validOptionNames[index];
            if (options.extra && optionName in options.extra) {
                mongoOptions[optionName] = options.extra[optionName];
            }
            else if (optionName in options) {
                mongoOptions[optionName] = options[optionName];
            }
        }
        return mongoOptions;
    }
}

//# sourceMappingURL=MongoDriver.js.map
