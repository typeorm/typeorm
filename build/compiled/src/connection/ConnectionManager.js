"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const Connection_1 = require("./Connection");
const ConnectionNotFoundError_1 = require("../error/ConnectionNotFoundError");
const AlreadyHasActiveConnectionError_1 = require("../error/AlreadyHasActiveConnectionError");
/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
class ConnectionManager {
    constructor() {
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * List of connections registered in this connection manager.
         */
        this.connections = [];
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Checks if connection with the given name exist in the manager.
     */
    has(name) {
        return !!this.connections.find(connection => connection.name === name);
    }
    /**
     * Gets registered connection with the given name.
     * If connection name is not given then it will get a default connection.
     * Throws error if connection with the given name was not found.
     */
    get(name = "default") {
        const connection = this.connections.find(connection => connection.name === name);
        if (!connection)
            throw new ConnectionNotFoundError_1.ConnectionNotFoundError(name);
        return connection;
    }
    /**
     * Creates a new connection based on the given connection options and registers it in the manager.
     * Connection won't be established, you'll need to manually call connect method to establish connection.
     */
    create(options) {
        // check if such connection is already registered
        const existConnection = this.connections.find(connection => connection.name === (options.name || "default"));
        if (existConnection) {
            // if connection is registered and its not closed then throw an error
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError_1.AlreadyHasActiveConnectionError(options.name || "default");
            // if its registered but closed then simply remove it from the manager
            this.connections.splice(this.connections.indexOf(existConnection), 1);
        }
        // create a new connection
        const connection = new Connection_1.Connection(options);
        this.connections.push(connection);
        return connection;
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=ConnectionManager.js.map