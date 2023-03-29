"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDriver = void 0;
var tslib_1 = require("tslib");
var ConnectionIsNotSetError_1 = require("../../error/ConnectionIsNotSetError");
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
var MongoQueryRunner_1 = require("./MongoQueryRunner");
var PlatformTools_1 = require("../../platform/PlatformTools");
var MongoSchemaBuilder_1 = require("../../schema-builder/MongoSchemaBuilder");
var ObjectUtils_1 = require("../../util/ObjectUtils");
var ApplyValueTransformers_1 = require("../../util/ApplyValueTransformers");
var DriverUtils_1 = require("../DriverUtils");
/**
 * Organizes communication with MongoDB.
 */
var MongoDriver = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MongoDriver(connection) {
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
    MongoDriver.prototype.connect = function () {
        var _this = this;
        return new Promise(function (ok, fail) {
            var options = DriverUtils_1.DriverUtils.buildMongoDBDriverOptions(_this.options);
            _this.mongodb.MongoClient.connect(_this.buildConnectionUrl(options), _this.buildConnectionOptions(options), function (err, client) {
                if (err)
                    return fail(err);
                _this.queryRunner = new MongoQueryRunner_1.MongoQueryRunner(_this.connection, client);
                ObjectUtils_1.ObjectUtils.assign(_this.queryRunner, { manager: _this.connection.manager });
                ok();
            });
        });
    };
    MongoDriver.prototype.afterConnect = function () {
        return Promise.resolve();
    };
    /**
     * Closes connection with the database.
     */
    MongoDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        if (!_this.queryRunner)
                            return fail(new ConnectionIsNotSetError_1.ConnectionIsNotSetError("mongodb"));
                        var handler = function (err) { return err ? fail(err) : ok(); };
                        _this.queryRunner.databaseConnection.close(handler);
                        _this.queryRunner = undefined;
                    })];
            });
        });
    };
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    MongoDriver.prototype.createSchemaBuilder = function () {
        return new MongoSchemaBuilder_1.MongoSchemaBuilder(this.connection);
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    MongoDriver.prototype.createQueryRunner = function (mode) {
        return this.queryRunner;
    };
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    MongoDriver.prototype.escapeQueryWithParameters = function (sql, parameters, nativeParameters) {
        throw new Error("This operation is not supported by Mongodb driver.");
    };
    /**
     * Escapes a column name.
     */
    MongoDriver.prototype.escape = function (columnName) {
        return columnName;
    };
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    MongoDriver.prototype.buildTableName = function (tableName, schema, database) {
        return tableName;
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    MongoDriver.prototype.preparePersistentValue = function (value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return value;
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    MongoDriver.prototype.prepareHydratedValue = function (value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    };
    /**
     * Creates a database type from a given column metadata.
     */
    MongoDriver.prototype.normalizeType = function (column) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Normalizes "default" value of the column.
     */
    MongoDriver.prototype.normalizeDefault = function (columnMetadata) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Normalizes "isUnique" value of the column.
     */
    MongoDriver.prototype.normalizeIsUnique = function (column) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Calculates column length taking into account the default length values.
     */
    MongoDriver.prototype.getColumnLength = function (column) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Normalizes "default" value of the column.
     */
    MongoDriver.prototype.createFullType = function (column) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    MongoDriver.prototype.obtainMasterConnection = function () {
        return Promise.resolve();
    };
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    MongoDriver.prototype.obtainSlaveConnection = function () {
        return Promise.resolve();
    };
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    MongoDriver.prototype.createGeneratedMap = function (metadata, insertedId) {
        return metadata.objectIdColumn.createValueMap(insertedId);
    };
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    MongoDriver.prototype.findChangedColumns = function (tableColumns, columnMetadatas) {
        throw new Error("MongoDB is schema-less, not supported by this driver.");
    };
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    MongoDriver.prototype.isReturningSqlSupported = function () {
        return false;
    };
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    MongoDriver.prototype.isUUIDGenerationSupported = function () {
        return false;
    };
    /**
     * Returns true if driver supports fulltext indices.
     */
    MongoDriver.prototype.isFullTextColumnTypeSupported = function () {
        return false;
    };
    /**
     * Creates an escaped parameter.
     */
    MongoDriver.prototype.createParameter = function (parameterName, index) {
        return "";
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     */
    MongoDriver.prototype.validateOptions = function (options) {
        // if (!options.url) {
        //     if (!options.database)
        //         throw new DriverOptionNotSetError("database");
        // }
    };
    /**
     * Loads all driver dependencies.
     */
    MongoDriver.prototype.loadDependencies = function () {
        try {
            this.mongodb = PlatformTools_1.PlatformTools.load("mongodb"); // try to load native driver dynamically
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("MongoDB", "mongodb");
        }
    };
    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    MongoDriver.prototype.buildConnectionUrl = function (options) {
        var schemaUrlPart = options.type.toLowerCase();
        var credentialsUrlPart = (options.username && options.password)
            ? options.username + ":" + options.password + "@"
            : "";
        var connectionString = undefined;
        if (options.replicaSet) {
            connectionString = schemaUrlPart + "://" + credentialsUrlPart + options.hostReplicaSet + "/" + (options.database || "");
        }
        else {
            var portUrlPart = (schemaUrlPart === "mongodb+srv")
                ? ""
                : ":" + (options.port || "27017");
            connectionString = schemaUrlPart + "://" + credentialsUrlPart + (options.host || "127.0.0.1") + portUrlPart + "/" + (options.database || "");
        }
        return connectionString;
    };
    /**
     * Build connection options from MongoConnectionOptions
     */
    MongoDriver.prototype.buildConnectionOptions = function (options) {
        var mongoOptions = {};
        for (var index = 0; index < this.validOptionNames.length; index++) {
            var optionName = this.validOptionNames[index];
            if (options.extra && optionName in options.extra) {
                mongoOptions[optionName] = options.extra[optionName];
            }
            else if (optionName in options) {
                mongoOptions[optionName] = options[optionName];
            }
        }
        return mongoOptions;
    };
    return MongoDriver;
}());
exports.MongoDriver = MongoDriver;

//# sourceMappingURL=MongoDriver.js.map
