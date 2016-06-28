import { CreateConnectionOptions } from './connection-manager/CreateConnectionOptions';
import { ConnectionManager } from './connection-manager/ConnectionManager';
import { getFromContainer } from './index';
import { Connection } from './connection/Connection';

// -------------------------------------------------------------------------
// Global Connection Manager
// -------------------------------------------------------------------------

/**
 * Default export. Global connection manager.
 */
let connectionManager: ConnectionManager;

/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager() {
  if (!connectionManager) {
    connectionManager = getFromContainer(ConnectionManager);
  }

  return connectionManager;
}

/**
 * Allows to quickly create a connection based on the given options. Uses ConnectionManager.
 */
export function createConnection(options: CreateConnectionOptions):Promise<Connection> {
  return getConnectionManager().create(options).connect();
}

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------
export { Connection } from "./connection/Connection";
export { ConnectionOptions } from "./connection/ConnectionOptions";
export { ConnectionManager } from "./connection-manager/ConnectionManager";
export { CreateConnectionOptions } from "./connection-manager/CreateConnectionOptions";
export { MysqlDriver } from "./driver/MysqlDriver";
export { Driver } from "./driver/Driver";