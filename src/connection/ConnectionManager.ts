import {Connection} from "./Connection";
import {ConnectionNotFoundError} from "../error/ConnectionNotFoundError";
import {ConnectionOptions} from "./ConnectionOptions";
import {AlreadyHasActiveConnectionError} from "../error/AlreadyHasActiveConnectionError";

/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export class ConnectionManager {
    /**
     * List of connections registered in this connection manager.
     */
    get connections(): Connection[] {
        return Array.from(this.connectionMap.values());
    }

    /**
     * Internal lookup to quickly get from a connection name to the Connection object.
     */
    private readonly connectionMap: Map<string, Connection> = new Map();

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if connection with the given name exist in the manager.
     */
    has(name: string): boolean {
        return this.connectionMap.has(name);
    }

    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     * Throws error if connection with the given name was not found.
     */
    get(name: string = "default"): Connection {
        const connection = this.connectionMap.get(name);
        if (!connection)
            throw new ConnectionNotFoundError(name);

        return connection;
    }

    /**
     * Creates a new connection based on the given connection options and registers it in the manager.
     * Connection won't be established, you'll need to manually call connect method to establish connection.
     */
    create(options: ConnectionOptions): Connection {
        // check if such connection is already registered
        const existConnection = this.connectionMap.get(options.name || "default");
        if (existConnection) {
            // if connection is registered and its not closed then throw an error
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError(options.name || "default");
        }

        // create a new connection
        const connection = new Connection(options);
        this.connectionMap.set(connection.name, connection);
        return connection;
    }

}
