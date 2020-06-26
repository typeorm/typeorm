import { ConnectionOptions } from '../connection/ConnectionOptions';
import { ConnectionManager } from '../connection/ConnectionManager';
import { getFromContainer } from '../container';
import { Connection } from '../connection/Connection';
import { PromiseUtils } from '../util/PromiseUtils';
import { EntityManager } from '../entity-manager/EntityManager';
import { ObjectType } from '../common/ObjectType';
import { EntitySchema } from '../entity-schema/EntitySchema';
import { Repository } from '../repository/Repository';
import { TreeRepository } from '../repository/TreeRepository';
import { SelectQueryBuilder } from '../query-builder/QueryBuilder';

export * from '../metadata-args/get-metadata-args-storage';

/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager(): ConnectionManager {
    return getFromContainer(ConnectionManager);
}

/**
 * Creates a new connection and registers it in the manager.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export async function createConnection(): Promise<Connection>;

/**
 * Creates a new connection from the ormconfig file with a given name.
 */
export async function createConnection(name: string): Promise<Connection>;

/**
 * Creates a new connection and registers it in the manager.
 */
export async function createConnection(options: ConnectionOptions): Promise<Connection>;

/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export async function createConnection(optionsOrName?: any): Promise<Connection> {
    return getConnectionManager().create(optionsOrName).connect();
}

/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
export async function createConnections(options: ConnectionOptions[]): Promise<Connection[]> {
    const connections = options.map(options => getConnectionManager().create(options));
    return PromiseUtils.runInSequence(connections, connection => connection.connect());
}

/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getConnection(connectionName: string = "default"): Connection {
    return getConnectionManager().get(connectionName);
}

/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getManager(connectionName: string = "default"): EntityManager {
    return getConnectionManager().get(connectionName).manager;
}

/**
 * Gets repository for the given entity class.
 */
export function getRepository<Entity>(entityClass: ObjectType<Entity> | EntitySchema<Entity> | string, connectionName: string = "default"): Repository<Entity> {
    return getConnectionManager().get(connectionName).getRepository<Entity>(entityClass);
}

/**
 * Gets tree repository for the given entity class.
 */
export function getTreeRepository<Entity>(entityClass: ObjectType<Entity> | string, connectionName: string = "default"): TreeRepository<Entity> {
    return getConnectionManager().get(connectionName).getTreeRepository<Entity>(entityClass);
}

/**
 * Gets tree repository for the given entity class.
 */
export function getCustomRepository<T>(customRepository: ObjectType<T>, connectionName: string = "default"): T {
    return getConnectionManager().get(connectionName).getCustomRepository(customRepository);
}

/**
 * Creates a new query builder.
 */
export function createQueryBuilder<Entity>(entityClass?: ObjectType<Entity> | string, alias?: string, connectionName: string = "default"): SelectQueryBuilder<Entity> {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }

    return getConnection(connectionName).createQueryBuilder();
}
