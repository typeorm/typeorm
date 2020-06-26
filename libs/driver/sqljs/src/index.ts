import { SqljsEntityManager } from './lib/SqljsEntityManager';
import { getConnectionManager } from '@typeorm/core';

export * from './lib/SqljsConnectionOptions';
export * from './lib/SqljsDriver';
export * from './lib/SqljsQueryRunner';
export * from './lib/SqljsEntityManager';

/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
export function getSqljsManager(connectionName: string = "default"): SqljsEntityManager {
    return getConnectionManager().get(connectionName).manager as SqljsEntityManager;
}
