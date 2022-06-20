import { MetadataArgsStorage } from "./metadata-args/MetadataArgsStorage";
import { PlatformTools } from "./platform/PlatformTools";
import { ConnectionOptionsReader } from "./connection/ConnectionOptionsReader";
import { ConnectionManager } from "./connection/ConnectionManager";
import { getFromContainer } from "./container";
import { ObjectUtils } from "./util/ObjectUtils";
/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage() {
    // we should store metadata storage in a global variable otherwise it brings too much problems
    // one of the problem is that if any entity (or any other) will be imported before consumer will call
    // useContainer method with his own container implementation, that entity will be registered in the
    // old old container (default one post probably) and consumer will his entity.
    // calling useContainer before he imports any entity (or any other) is not always convenient.
    // another reason is that when we run migrations typeorm is being called from a global package
    // and it may load entities which register decorators in typeorm of local package
    // this leads to impossibility of usage of entities in migrations and cli related operations
    const globalScope = PlatformTools.getGlobalVariable();
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage();
    return globalScope.typeormMetadataArgsStorage;
}
/**
 * Reads connection options stored in ormconfig configuration file.
 *
 * @deprecated
 */
export async function getConnectionOptions(connectionName = "default") {
    return new ConnectionOptionsReader().get(connectionName);
}
/**
 * Gets a ConnectionManager which creates connections.
 *
 * @deprecated
 */
export function getConnectionManager() {
    return getFromContainer(ConnectionManager);
}
/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 *
 * @deprecated
 */
export async function createConnection(optionsOrName) {
    const connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
    const options = ObjectUtils.isObject(optionsOrName)
        ? optionsOrName
        : await getConnectionOptions(connectionName);
    return getConnectionManager().create(options).connect();
}
/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 *
 * @deprecated
 */
export async function createConnections(options) {
    if (!options)
        options = await new ConnectionOptionsReader().all();
    const connections = options.map((options) => getConnectionManager().create(options));
    // Do not use Promise.all or test 8522 will produce a dangling sqlite connection
    for (const connection of connections) {
        await connection.connect();
    }
    return connections;
}
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
export function getConnection(connectionName = "default") {
    return getConnectionManager().get(connectionName);
}
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
export function getManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 *
 * @deprecated
 */
export function getMongoManager(connectionName = "default") {
    return getConnectionManager().get(connectionName)
        .manager;
}
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 *
 * @deprecated
 */
export function getSqljsManager(connectionName = "default") {
    return getConnectionManager().get(connectionName)
        .manager;
}
/**
 * Gets repository for the given entity class.
 *
 * @deprecated
 */
export function getRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getRepository(entityClass);
}
/**
 * Gets tree repository for the given entity class.
 *
 * @deprecated
 */
export function getTreeRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getTreeRepository(entityClass);
}
/**
 * Gets tree repository for the given entity class.
 *
 * @deprecated
 */
export function getCustomRepository(customRepository, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getCustomRepository(customRepository);
}
/**
 * Gets mongodb repository for the given entity class or name.
 *
 * @deprecated
 */
export function getMongoRepository(entityClass, connectionName = "default") {
    return getConnectionManager()
        .get(connectionName)
        .getMongoRepository(entityClass);
}
/**
 * Creates a new query builder.
 *
 * @deprecated
 */
export function createQueryBuilder(entityClass, alias, connectionName = "default") {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }
    return getConnection(connectionName).createQueryBuilder();
}

//# sourceMappingURL=globals.js.map
