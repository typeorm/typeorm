"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PostgresDriver_1 = require("../../src/driver/postgres/PostgresDriver");
var SqlServerDriver_1 = require("../../src/driver/sqlserver/SqlServerDriver");
var index_1 = require("../../src/index");
var PromiseUtils_1 = require("../../src/util/PromiseUtils");
/**
 * Creates a testing connection options for the given driver type based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
function setupSingleTestingConnection(driverType, options) {
    var testingConnections = setupTestingConnections({
        name: options.name ? options.name : undefined,
        entities: options.entities ? options.entities : [],
        subscribers: options.subscribers ? options.subscribers : [],
        dropSchema: options.dropSchema ? options.dropSchema : false,
        schemaCreate: options.schemaCreate ? options.schemaCreate : false,
        enabledDrivers: [driverType],
        cache: options.cache,
        schema: options.schema ? options.schema : undefined,
        namingStrategy: options.namingStrategy ? options.namingStrategy : undefined
    });
    if (!testingConnections.length)
        return undefined;
    return testingConnections[0];
}
exports.setupSingleTestingConnection = setupSingleTestingConnection;
/**
 * Loads test connection options from ormconfig.json file.
 */
function getTypeOrmConfig() {
    try {
        try {
            return require(__dirname + "/../../../../ormconfig.json");
        }
        catch (err) {
            return require(__dirname + "/../../ormconfig.json");
        }
    }
    catch (err) {
        throw new Error("Cannot find ormconfig.json file in the root of the project. To run tests please create ormconfig.json file" +
            " in the root of the project (near ormconfig.json.dist, you need to copy ormconfig.json.dist into ormconfig.json" +
            " and change all database settings to match your local environment settings).");
    }
}
exports.getTypeOrmConfig = getTypeOrmConfig;
/**
 * Creates a testing connections options based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
function setupTestingConnections(options) {
    var ormConfigConnectionOptionsArray = getTypeOrmConfig();
    if (!ormConfigConnectionOptionsArray.length)
        throw new Error("No connections setup in ormconfig.json file. Please create configurations for each database type to run tests.");
    return ormConfigConnectionOptionsArray
        .filter(function (connectionOptions) {
        if (connectionOptions.skip === true)
            return false;
        if (options && options.enabledDrivers && options.enabledDrivers.length)
            return options.enabledDrivers.indexOf(connectionOptions.type) !== -1; // ! is temporary
        if (connectionOptions.disabledIfNotEnabledImplicitly === true)
            return false;
        return true;
    })
        .map(function (connectionOptions) {
        var newOptions = Object.assign({}, connectionOptions, {
            name: options && options.name ? options.name : connectionOptions.name,
            entities: options && options.entities ? options.entities : [],
            migrations: options && options.migrations ? options.migrations : [],
            subscribers: options && options.subscribers ? options.subscribers : [],
            dropSchema: options && options.dropSchema !== undefined ? options.dropSchema : false,
            cache: options ? options.cache : undefined,
        });
        if (options && options.driverSpecific)
            newOptions = Object.assign({}, options.driverSpecific, newOptions);
        if (options && options.schemaCreate)
            newOptions.synchronize = options.schemaCreate;
        if (options && options.schema)
            newOptions.schema = options.schema;
        if (options && options.logging !== undefined)
            newOptions.logging = options.logging;
        if (options && options.__dirname)
            newOptions.entities = [options.__dirname + "/entity/*{.js,.ts}"];
        if (options && options.__dirname)
            newOptions.migrations = [options.__dirname + "/migration/*{.js,.ts}"];
        if (options && options.namingStrategy)
            newOptions.namingStrategy = options.namingStrategy;
        return newOptions;
    });
}
exports.setupTestingConnections = setupTestingConnections;
/**
 * Creates a testing connections based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
function createTestingConnections(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var connections;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, index_1.createConnections(setupTestingConnections(options))];
                case 1:
                    connections = _a.sent();
                    return [4 /*yield*/, Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var databases, queryRunner, schemaPaths_1, schema;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        databases = [];
                                        connection.entityMetadatas.forEach(function (metadata) {
                                            if (metadata.database && databases.indexOf(metadata.database) === -1)
                                                databases.push(metadata.database);
                                        });
                                        queryRunner = connection.createQueryRunner();
                                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(databases, function (database) { return queryRunner.createDatabase(database, true); })];
                                    case 1:
                                        _a.sent();
                                        if (!(connection.driver instanceof PostgresDriver_1.PostgresDriver || connection.driver instanceof SqlServerDriver_1.SqlServerDriver)) return [3 /*break*/, 3];
                                        schemaPaths_1 = [];
                                        connection.entityMetadatas
                                            .filter(function (entityMetadata) { return !!entityMetadata.schemaPath; })
                                            .forEach(function (entityMetadata) {
                                            var existSchemaPath = schemaPaths_1.find(function (path) { return path === entityMetadata.schemaPath; });
                                            if (!existSchemaPath)
                                                schemaPaths_1.push(entityMetadata.schemaPath);
                                        });
                                        schema = connection.driver.options.schema;
                                        if (schema && schemaPaths_1.indexOf(schema) === -1)
                                            schemaPaths_1.push(schema);
                                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(schemaPaths_1, function (schemaPath) { return queryRunner.createSchema(schemaPath, true); })];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [4 /*yield*/, queryRunner.release()];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, connections];
            }
        });
    });
}
exports.createTestingConnections = createTestingConnections;
/**
 * Closes testing connections if they are connected.
 */
function closeTestingConnections(connections) {
    return Promise.all(connections.map(function (connection) { return connection && connection.isConnected ? connection.close() : undefined; }));
}
exports.closeTestingConnections = closeTestingConnections;
/**
 * Reloads all databases for all given connections.
 */
function reloadTestingDatabases(connections) {
    return Promise.all(connections.map(function (connection) { return connection.synchronize(true); }));
}
exports.reloadTestingDatabases = reloadTestingDatabases;
/**
 * Generates random text array with custom length.
 */
function generateRandomText(length) {
    var text = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i <= length; i++)
        text += characters.charAt(Math.floor(Math.random() * characters.length));
    return text;
}
exports.generateRandomText = generateRandomText;
function sleep(ms) {
    return new Promise(function (ok) {
        setTimeout(ok, ms);
    });
}
exports.sleep = sleep;
//# sourceMappingURL=test-utils.js.map