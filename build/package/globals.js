"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueryBuilder = exports.getMongoRepository = exports.getCustomRepository = exports.getTreeRepository = exports.getRepository = exports.getSqljsManager = exports.getMongoManager = exports.getManager = exports.getConnection = exports.createConnections = exports.createConnection = exports.getConnectionManager = exports.getConnectionOptions = exports.getMetadataArgsStorage = void 0;
const MetadataArgsStorage_1 = require("./metadata-args/MetadataArgsStorage");
const PlatformTools_1 = require("./platform/PlatformTools");
const ConnectionOptionsReader_1 = require("./connection/ConnectionOptionsReader");
const ConnectionManager_1 = require("./connection/ConnectionManager");
const container_1 = require("./container");
const ObjectUtils_1 = require("./util/ObjectUtils");
/**
 * Gets metadata args storage.
 */
function getMetadataArgsStorage() {
    // we should store metadata storage in a global variable otherwise it brings too much problems
    // one of the problem is that if any entity (or any other) will be imported before consumer will call
    // useContainer method with his own container implementation, that entity will be registered in the
    // old old container (default one post probably) and consumer will his entity.
    // calling useContainer before he imports any entity (or any other) is not always convenient.
    // another reason is that when we run migrations typeorm is being called from a global package
    // and it may load entities which register decorators in typeorm of local package
    // this leads to impossibility of usage of entities in migrations and cli related operations
    const globalScope = PlatformTools_1.PlatformTools.getGlobalVariable();
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage_1.MetadataArgsStorage();
    return globalScope.typeormMetadataArgsStorage;
}
exports.getMetadataArgsStorage = getMetadataArgsStorage;
/**
 * Reads connection options stored in ormconfig configuration file.
 *
 * @deprecated
 */
async function getConnectionOptions(connectionName = "default") {
    return new ConnectionOptionsReader_1.ConnectionOptionsReader().get(connectionName);
}
exports.getConnectionOptions = getConnectionOptions;
/**
 * Gets a ConnectionManager which creates connections.
 *
 * @deprecated
 */
function getConnectionManager() {
    return (0, container_1.getFromContainer)(ConnectionManager_1.ConnectionManager);
}
exports.getConnectionManager = getConnectionManager;
/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 *
 * @deprecated
 */
async function createConnection(optionsOrName) {
    const connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
    const options = ObjectUtils_1.ObjectUtils.isObject(optionsOrName)
        ? optionsOrName
        : await getConnectionOptions(connectionName);
    return getConnectionManager().create(options).connect();
}
exports.createConnection = createConnection;
/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 *
 * @deprecated
 */
async function createConnections(options) {
    if (!options)
        options = await new ConnectionOptionsReader_1.ConnectionOptionsReader().all();
    const connections = options.map((options) => getConnectionManager().create(options));
    // Do not use Promise.all or test 8522 will produce a dangling sqlite connection
    for (const connection of connections) {
        await connection.connect();
    }
    return connections;
}
exports.createConnections = createConnections;
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
function getConnection(connectionName = "default") {
    return getConnectionManager().get(connectionName);
}
exports.getConnection = getConnection;
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
function getManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
exports.getManager = getManager;
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
function getMongoManager(connectionName = "default") {
    return getConnectionManager().get(connectionName)
        .manager;
}
exports.getMongoManager = getMongoManager;
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 *
 * @deprecated
 */
function getSqljsManager(connectionName = "default") {
    return getConnectionManager().get(connectionName)
        .manager;
}
exports.getSqljsManager = getSqljsManager;
/**
 * Gets repository for the given entity class.
 *
 * @deprecated
 */
function getRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getRepository(entityClass);
}
exports.getRepository = getRepository;
/**
 * Gets tree repository for the given entity class.
 *
 * @deprecated
 */
function getTreeRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getTreeRepository(entityClass);
}
exports.getTreeRepository = getTreeRepository;
/**
 * Gets tree repository for the given entity class.
 *
 * @deprecated
 */
function getCustomRepository(customRepository, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getCustomRepository(customRepository);
}
exports.getCustomRepository = getCustomRepository;
/**
 * Gets mongodb repository for the given entity class or name.
 *
 * @deprecated
 */
function getMongoRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getMongoRepository(entityClass);
}
exports.getMongoRepository = getMongoRepository;
/**
 * Creates a new query builder.
 *
 * @deprecated
 */
function createQueryBuilder(entityClass, alias, connectionName = "default") {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }
    return getConnection(connectionName).createQueryBuilder();
}
exports.createQueryBuilder = createQueryBuilder;

//# sourceMappingURL=globals.js.map
