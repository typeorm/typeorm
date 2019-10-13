import { Connection } from "../../src/connection/Connection";
import { ConnectionOptions } from "../../src/connection/ConnectionOptions";
import { DatabaseType } from "../../src/driver/types/DatabaseType";
import { EntitySchema } from "../../src/entity-schema/EntitySchema";
import { NamingStrategyInterface } from "../../src/naming-strategy/NamingStrategyInterface";
/**
 * Interface in which data is stored in ormconfig.json of the project.
 */
export declare type TestingConnectionOptions = ConnectionOptions & {
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
     * Dirname of the test directory.
     * If specified, entities will be loaded from that directory.
     */
    __dirname?: string;
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
    entities?: (string | Function | EntitySchema<any>)[];
    /**
     * Migrations needs to be included in connection for the given test suite.
     */
    migrations?: string[];
    /**
     * Subscribers needs to be included in the connection for the given test suite.
     */
    subscribers?: string[] | Function[];
    /**
     * Indicates if schema sync should be performed or not.
     */
    schemaCreate?: boolean;
    /**
     * Indicates if schema should be dropped on connection setup.
     */
    dropSchema?: boolean;
    /**
     * Enables or disables logging.
     */
    logging?: boolean;
    /**
     * Schema name used for postgres driver.
     */
    schema?: string;
    /**
     * Naming strategy defines how auto-generated names for such things like table name, or table column gonna be
     * generated.
     */
    namingStrategy?: NamingStrategyInterface;
    /**
     * Schema name used for postgres driver.
     */
    cache?: boolean | {
        /**
         * Type of caching.
         *
         * - "database" means cached values will be stored in the separate table in database. This is default value.
         * - "mongodb" means cached values will be stored in mongodb database. You must provide mongodb connection options.
         * - "redis" means cached values will be stored inside redis. You must provide redis connection options.
         */
        type?: "database" | "redis";
        /**
         * Used to provide mongodb / redis connection options.
         */
        options?: any;
        /**
         * If set to true then queries (using find methods and QueryBuilder's methods) will always be cached.
         */
        alwaysEnabled?: boolean;
        /**
         * Time in milliseconds in which cache will expire.
         * This can be setup per-query.
         * Default value is 1000 which is equivalent to 1 second.
         */
        duration?: number;
    };
    /**
     * Options that may be specific to a driver.
     * They are passed down to the enabled drivers.
     */
    driverSpecific?: Object;
}
/**
 * Creates a testing connection options for the given driver type based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export declare function setupSingleTestingConnection(driverType: DatabaseType, options: TestingOptions): ConnectionOptions | undefined;
/**
 * Loads test connection options from ormconfig.json file.
 */
export declare function getTypeOrmConfig(): TestingConnectionOptions[];
/**
 * Creates a testing connections options based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export declare function setupTestingConnections(options?: TestingOptions): ConnectionOptions[];
/**
 * Creates a testing connections based on the configuration in the ormconfig.json
 * and given options that can override some of its configuration for the test-specific use case.
 */
export declare function createTestingConnections(options?: TestingOptions): Promise<Connection[]>;
/**
 * Closes testing connections if they are connected.
 */
export declare function closeTestingConnections(connections: Connection[]): Promise<void[]>;
/**
 * Reloads all databases for all given connections.
 */
export declare function reloadTestingDatabases(connections: Connection[]): Promise<void[]>;
/**
 * Generates random text array with custom length.
 */
export declare function generateRandomText(length: number): string;
export declare function sleep(ms: number): Promise<void>;
