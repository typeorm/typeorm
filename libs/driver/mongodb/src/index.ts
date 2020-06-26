import { MongoEntityManager } from './lib/MongoEntityManager';
import { createConnection, getConnectionManager, ObjectType } from '@typeorm/core';
import { MongoRepository } from './lib/MongoRepository';
import { MongoConnectionOptions } from './lib/MongoConnectionOptions';
import { MongoConnection } from './lib/MongoConnection';

export * from './lib/MongoConnection';
export * from './lib/MongoConnectionOptions';
export * from './lib/MongoDriver';
export * from './lib/MongoEntityManager';
export * from './lib/MongoQueryRunner';

export function createMongoConnection(options: MongoConnectionOptions) {
    return createConnection(options) as Promise<MongoConnection>;
}

/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getMongoManager(connectionName: string = "default"): MongoEntityManager {
    return getConnectionManager().get(connectionName).manager as MongoEntityManager;
}

/**
 * Gets mongodb repository for the given entity class or name.
 */
export function getMongoRepository<Entity>(entityClass: ObjectType<Entity> | string, connectionName: string = "default"): MongoRepository<Entity> {
    return getMongoManager(connectionName).getRepository<Entity>(entityClass) as MongoRepository<Entity>;
}
