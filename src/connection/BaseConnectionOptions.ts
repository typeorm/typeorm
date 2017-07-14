import {DriverOptions} from "../driver/DriverOptions";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {LoggerOptions} from "../logger/LoggerOptions";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {DatabaseType} from "../driver/types/DatabaseType";

/**
 * BaseConnectionOptions is set of connection options shared by all database types.
 */
export interface BaseConnectionOptions {

    /**
     * Database type. This value is required.
     *
     * "?" is temporary.
     */
    readonly type?: DatabaseType;

    /**
     * Connection name. If connection name is not given then it will be called "default".
     * Different connections must have different names.
     */
    readonly name?: string;

    /**
     * Database options of this connection.
     *
     * @deprecated Define options right in the connection options section.
     */
    readonly driver?: DriverOptions;

    /**
     * Extra connection options to be passed to the underlying driver.
     *
     * todo: deprecate this and move all database-specific types into hts own connection options object.
     */
    readonly extra?: any;

    /**
     * Prefix to use on all tables (collections) of this connection in the database.
     *
     * todo: rename to entityPrefix
     */
    readonly tablesPrefix?: string;

    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    readonly namingStrategy?: NamingStrategyInterface;

    /**
     * Entities to be loaded for this connection.
     * Accepts both entity classes and directories where from entities need to be loaded.
     * Directories support glob patterns.
     */
    readonly entities?: Function[]|string[];

    /**
     * Subscribers to be loaded for this connection.
     * Accepts both subscriber classes and directories where from subscribers need to be loaded.
     * Directories support glob patterns.
     */
    readonly subscribers?: Function[]|string[];

    /**
     * Entity schemas to be loaded for this connection.
     * Accepts both entity schema classes and directories where from entity schemas need to be loaded.
     * Directories support glob patterns.
     */
    readonly entitySchemas?: EntitySchema[]|string[];

    /**
     * Migrations to be loaded for this connection.
     * Accepts both migration classes and directories where from migrations need to be loaded.
     * Directories support glob patterns.
     */
    readonly migrations?: Function[]|string[];

    /**
     * Logging options.
     */
    readonly logging?: LoggerOptions;

    /**
     * Drops the schema each time connection is being established.
     * Be careful with this option and don't use this in production - otherwise you'll loose all production data.
     * This option is useful during debug and development.
     */
    readonly dropSchemaOnConnection?: boolean;

    /**
     * Indicates if database schema should be auto created on every application launch.
     * Be careful with this option and don't use this in production - otherwise you can loose production data.
     * This option is useful during debug and development.
     * Alternative to it, you can use CLI and run schema:sync command.
     *
     * Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
     * Instead, it syncs just by creating indices.
     *
     * todo: rename it simply to synchronize: boolean ?
     */
    readonly autoSchemaSync?: boolean;

    /**
     * Indicates if migrations should be auto run on every application launch.
     * Alternative to it, you can use CLI and run migration:create command.
     *
     * todo: rename it simply to runMigrations: boolean ?
     */
    readonly autoMigrationsRun?: boolean;

    /**
     * CLI settings.
     */
    readonly cli?: {

        /**
         * Directory where entities should be created by default.
         */
        readonly entitiesDir?: string;

        /**
         * Directory where migrations should be created by default.
         */
        readonly migrationsDir?: string;

        /**
         * Directory where subscribers should be created by default.
         */
        readonly subscribersDir?: string;

    };

}