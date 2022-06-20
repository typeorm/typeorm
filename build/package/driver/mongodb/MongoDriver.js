"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDriver = void 0;
const ConnectionIsNotSetError_1 = require("../../error/ConnectionIsNotSetError");
const DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
const MongoQueryRunner_1 = require("./MongoQueryRunner");
const PlatformTools_1 = require("../../platform/PlatformTools");
const MongoSchemaBuilder_1 = require("../../schema-builder/MongoSchemaBuilder");
const ObjectUtils_1 = require("../../util/ObjectUtils");
const ApplyValueTransformers_1 = require("../../util/ApplyValueTransformers");
const DriverUtils_1 = require("../DriverUtils");
const error_1 = require("../../error");
const InstanceChecker_1 = require("../../util/InstanceChecker");
/**
 * Organizes communication with MongoDB.
 */
class MongoDriver {
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
         * Represent transaction support by this driver
         */
        this.transactionSupport = "none";
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
            "writeConcern",
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
            // Do not overwrite BaseDataSourceOptions.logger
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
            "autoEncryption",
            "retryWrites",
        ];
        this.cteCapabilities = {
            enabled: false,
        };
        this.options = connection.options;
        // validate options to make sure everything is correct and driver will be able to establish connection
        this.validateOptions(connection.options);
        // load mongodb package
        this.loadDependencies();
        this.database = DriverUtils_1.DriverUtils.buildMongoDBDriverOptions(this.options).database;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    connect() {
        return new Promise((ok, fail) => {
            const options = DriverUtils_1.DriverUtils.buildMongoDBDriverOptions(this.options);
            this.mongodb.MongoClient.connect(this.buildConnectionUrl(options), this.buildConnectionOptions(options), (err, client) => {
                if (err)
                    return fail(err);
                this.queryRunner = new MongoQueryRunner_1.MongoQueryRunner(this.connection, client);
                ObjectUtils_1.ObjectUtils.assign(this.queryRunner, {
                    manager: this.connection.manager,
                });
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
    async disconnect() {
        return new Promise((ok, fail) => {
            if (!this.queryRunner)
                return fail(new ConnectionIsNotSetError_1.ConnectionIsNotSetError("mongodb"));
            const handler = (err) => (err ? fail(err) : ok());
            this.queryRunner.databaseConnection.close(handler);
            this.queryRunner = undefined;
        });
    }
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new MongoSchemaBuilder_1.MongoSchemaBuilder(this.connection);
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
        throw new error_1.TypeORMError(`This operation is not supported by Mongodb driver.`);
    }
    /**
     * Escapes a column name.
     */
    escape(columnName) {
        return columnName;
    }
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. myDB.mySchema.myTable
     */
    buildTableName(tableName, schema, database) {
        return tableName;
    }
    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(target) {
        if (InstanceChecker_1.InstanceChecker.isEntityMetadata(target)) {
            return {
                tableName: target.tableName,
            };
        }
        if (InstanceChecker_1.InstanceChecker.isTable(target) || InstanceChecker_1.InstanceChecker.isView(target)) {
            return {
                tableName: target.name,
            };
        }
        if (InstanceChecker_1.InstanceChecker.isTableForeignKey(target)) {
            return {
                tableName: target.referencedTableName,
            };
        }
        return {
            tableName: target,
        };
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column) {
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata) {
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column) {
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column) {
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
    }
    /**
     * Normalizes "default" value of the column.
     */
    createFullType(column) {
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
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
        throw new error_1.TypeORMError(`MongoDB is schema-less, not supported by this driver.`);
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
        // todo: fix
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
            const mongodb = this.options.driver || PlatformTools_1.PlatformTools.load("mongodb");
            this.mongodb = mongodb;
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("MongoDB", "mongodb");
        }
    }
    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    buildConnectionUrl(options) {
        const schemaUrlPart = options.type.toLowerCase();
        const credentialsUrlPart = options.username && options.password
            ? `${options.username}:${options.password}@`
            : "";
        const portUrlPart = schemaUrlPart === "mongodb+srv" ? "" : `:${options.port || "27017"}`;
        let connectionString;
        if (options.replicaSet) {
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${options.hostReplicaSet ||
                options.host + portUrlPart ||
                "127.0.0.1" + portUrlPart}/${options.database || ""}?replicaSet=${options.replicaSet}${options.tls ? "&tls=true" : ""}`;
        }
        else {
            connectionString = `${schemaUrlPart}://${credentialsUrlPart}${options.host || "127.0.0.1"}${portUrlPart}/${options.database || ""}${options.tls ? "?tls=true" : ""}`;
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
exports.MongoDriver = MongoDriver;

//# sourceMappingURL=MongoDriver.js.map
