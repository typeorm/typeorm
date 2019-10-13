import { Connection } from "./Connection";
import { ConnectionOptions } from "./ConnectionOptions";
/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export declare class ConnectionManager {
    /**
     * List of connections registered in this connection manager.
     */
    readonly connections: Connection[];
    /**
     * Checks if connection with the given name exist in the manager.
     */
    has(name: string): boolean;
    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     * Throws error if connection with the given name was not found.
     */
    get(name?: string): Connection;
    /**
     * Creates a new connection based on the given connection options and registers it in the manager.
     * Connection won't be established, you'll need to manually call connect method to establish connection.
     */
    create(options: ConnectionOptions): Connection;
}
