import {CreateConnectionOptions} from "../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../src/backend";
import {Connection} from "../../src/connection/Connection";
import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {EntitySchema} from "../../src/metadata/entity-schema/EntitySchema";

export interface TestingConnectionOptions {
    entities?: Function[];
    entitySchemas?: EntitySchema[];
    entityDirectories?: string[];
    secondaryConnections?: boolean;
}

export function closeConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.close()));
}

export function createTestingConnectionOptions(type: "mysql"|"mysqlSecondary"|"postgres"|"postgresSecondary"): ConnectionOptions {
    const parameters = require(__dirname + "/../../../../config/parameters.json"); // path is relative to compile directory
    // const parameters = require(__dirname + "/../../config/parameters.json");

    return {
        host: parameters.connections[type].host,
        port: parameters.connections[type].port,
        username: parameters.connections[type].username,
        password: parameters.connections[type].password,
        database: parameters.connections[type].database,
        autoSchemaCreate: true,
        logging: {
            // logQueries: true, // uncomment for debugging
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        }
    };
}

export async function setupTestingConnections(options?: TestingConnectionOptions): Promise<Connection[]> {
    
    const mysqlParameters: CreateConnectionOptions = {
        driver: "mysql",
        connectionName: "mysqlPrimaryConnection",
        connection: createTestingConnectionOptions("mysql"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };
    
    const mysqlSecondaryParameters: CreateConnectionOptions = {
        driver: "mysql",
        connectionName: "mysqlSecondaryConnection",
        connection: createTestingConnectionOptions("mysqlSecondary"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresParameters: CreateConnectionOptions = {
        driver: "postgres",
        connectionName: "postgresPrimaryConnection",
        connection: createTestingConnectionOptions("postgres"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const postgresSecondaryParameters: CreateConnectionOptions = {
        driver: "postgres",
        connectionName: "postgresSecondaryConnection",
        connection: createTestingConnectionOptions("postgresSecondary"),
        entities: options && options.entities ? options.entities : [],
        entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
        entityDirectories: options && options.entityDirectories ? options.entityDirectories : [],
    };

    const allParameters: CreateConnectionOptions[] = [mysqlParameters, /*, postgresParameters*/];
    if (options && options.secondaryConnections)
        allParameters.push(mysqlSecondaryParameters/*, postgresSecondaryParameters*/);
    
    return Promise.all(allParameters.map(parameters => createConnection(parameters)));
}

/**
 * @deprecated
 */
export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {

    const parameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test",
            autoSchemaCreate: true
        },
        entities: entities
    };

    return function() {
        return createConnection(parameters)
            .then(connection => {
                if (callback)
                    callback(connection);
                return connection;
            })
            .catch(e => console.log("Error during connection to db: " + e));
    };
}

export function reloadDatabases(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.syncSchema(true)));
}

/**
 */
export function reloadDatabase(connection: Connection) {
    return function () {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    };
}