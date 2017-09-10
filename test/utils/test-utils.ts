import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {createConnection, createConnections} from "../../src/index";
import {Connection} from "../../src/connection/Connection";
import {EntitySchema} from "../../src/entity-schema/EntitySchema";
import {DatabaseType} from "../../src/driver/types/DatabaseType";

/**
 * Interface in which data is stored in ormconfig.json of the project.
 */
export type TestingConnectionOptions = ConnectionOptions & {

    /**
     * Indicates if this connection should be skipped.
     */
    skip?: boolean;

    /**
     * If set to true then tests for this driver wont run until implicitly defined "enabledDrivers" section.
     */
    disabledIfNotEnabledImplicitly?: boolean;

};

/**
 * Options used to create a connection for testing purposes.
 */
export interface TestingOptions {

    /**
     * Connection name to be overridden.
     * This can be used to create multiple connections with single connection configuration.
     */
    name?: string;

    /**
     * List of enabled drivers for the given test suite.
     */
    enabledDrivers?: DatabaseType[];

    /**
     * Entities needs to be included in the connection for the given test suite.
     */
    entities?: string[]|Function[];

    /**
     * Subscribers needs to be included in the connection for the given test suite.
     */
    subscribers?: string[]|Function[];

    /**
     * Entity schemas needs to be included in the connection for the given test suite.
     */
    entitySchemas?: string[]|EntitySchema[];

    /**
     * Indicates if schema sync should be performed or not.
     */
    schemaCreate?: boolean;

    /**
     * Indicates if schema should be dropped on connection setup.
     */
    dropSchema?: boolean;

    /**
     * Schema name used for postgres driver.
     */
    schema?: string;

}

/**
 * Creates a testing connection options for the given driver type based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export function setupSingleTestingConnection(driverType: DatabaseType, options: TestingOptions): ConnectionOptions {

    const testingConnections = setupTestingConnections({
        name: options.name ? options.name : undefined,
        entities: options.entities ? options.entities : [],
        subscribers: options.subscribers ? options.subscribers : [],
        entitySchemas: options.entitySchemas ? options.entitySchemas : [],
        dropSchema: options.dropSchema ? options.dropSchema : false,
        schemaCreate: options.schemaCreate ? options.schemaCreate : false,
        enabledDrivers: [driverType],
        schema: options.schema ? options.schema : undefined
    });
    if (!testingConnections.length)
        throw new Error(`Unable to run tests because connection options for "${driverType}" are not set.`);

    return testingConnections[0];
}


/**
 * Loads test connection options from ormconfig.json file.
 */
export function getTypeOrmConfig(): TestingConnectionOptions[] {
    try {

        try {
            return require(__dirname + "/../../../../ormconfig.json");

        } catch (err) {
            return require(__dirname + "/../../ormconfig.json");
        }

    } catch (err) {
        throw new Error(`Cannot find ormconfig.json file in the root of the project. To run tests please create ormconfig.json file` +
            ` in the root of the project (near ormconfig.json.dist, you need to copy ormconfig.json.dist into ormconfig.json` +
            ` and change all database settings to match your local environment settings).`);
    }
}

/**
 * Creates a testing connections options based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export function setupTestingConnections(options?: TestingOptions): ConnectionOptions[] {
    const ormConfigConnectionOptionsArray = getTypeOrmConfig();

    if (!ormConfigConnectionOptionsArray.length)
        throw new Error(`No connections setup in ormconfig.json file. Please create configurations for each database type to run tests.`);

    return ormConfigConnectionOptionsArray
        .filter(connectionOptions => {
            if (connectionOptions.skip === true)
                return false;

            if (options && options.enabledDrivers && options.enabledDrivers.length)
                return options.enabledDrivers.indexOf(connectionOptions.type!) !== -1; // ! is temporary

            if (connectionOptions.disabledIfNotEnabledImplicitly === true)
                return false;

            return true;
        })
        .map(connectionOptions => {
            return Object.assign({}, connectionOptions as ConnectionOptions, {
                name: options && options.name ? options.name : connectionOptions.name,
                entities: options && options.entities ? options.entities : [],
                subscribers: options && options.subscribers ? options.subscribers : [],
                entitySchemas: options && options.entitySchemas ? options.entitySchemas : [],
                autoSchemaSync: options && (options.entities || options.entitySchemas) ? options.schemaCreate : false,
                dropSchema: options && (options.entities || options.entitySchemas) ? options.dropSchema : false,
                schema: options && options.schema ? options.schema : undefined,
            });
        });
}

/**
 * Creates a testing connections based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export async function createTestingConnections(options?: TestingOptions): Promise<Connection[]> {
    return createConnections(setupTestingConnections(options));
}

/**
 * Closes testing connections if they are connected.
 */
export function closeTestingConnections(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.isConnected ? connection.close() : undefined));
}

/**
 * Reloads all databases for all given connections.
 */
export function reloadTestingDatabases(connections: Connection[]) {
    return Promise.all(connections.map(connection => connection.synchronize(true)));
}

/**
 * Setups connection.
 *
 * @deprecated Old method of creating connection. Don't use it anymore. Use createTestingConnections instead.
 */
export function setupConnection(callback: (connection: Connection) => any, entities: Function[]) {
    return function() {
        return createConnection(setupSingleTestingConnection("mysql", { entities: entities }))
            .then(connection => {
                if (callback)
                    callback(connection);
                return connection;
            });
    };
}

/**
 * Generates random text array with custom length.
 */
export function generateRandomText(length: number): string {
    let text = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i <= length; i++ )
        text += characters.charAt(Math.floor(Math.random() * characters.length));

    return text;
}

export function sleep(ms: number): Promise<void> {
    return new Promise<void>(ok => {
        setTimeout(ok, ms);
    });
}