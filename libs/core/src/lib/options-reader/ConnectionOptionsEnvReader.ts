import { ConnectionOptions, OrmUtils } from "@typeorm/browser-core";

/**
 * Reads connection options from environment variables.
 * Environment variables can have only a single connection.
 * Its strongly required to define TYPEORM_CONNECTION env variable.
 */
export class ConnectionOptionsEnvReader {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Reads connection options from environment variables.
     */
    read(): ConnectionOptions {
        return {
            type: process.env["TYPEORM_CONNECTION"] || (process.env["TYPEORM_URL"] ? process.env["TYPEORM_URL"].split("://")[0] : undefined),
            url: process.env["TYPEORM_URL"],
            host: process.env["TYPEORM_HOST"],
            port: Number(process.env["TYPEORM_PORT"]),
            username: process.env["TYPEORM_USERNAME"],
            password: process.env["TYPEORM_PASSWORD"],
            database: process.env["TYPEORM_DATABASE"],
            sid: process.env["TYPEORM_SID"],
            schema: process.env["TYPEORM_SCHEMA"],
            extra: process.env["TYPEORM_DRIVER_EXTRA"] ? JSON.parse(process.env["TYPEORM_DRIVER_EXTRA"]) : undefined,
            synchronize: OrmUtils.toBoolean(process.env["TYPEORM_SYNCHRONIZE"]),
            dropSchema: OrmUtils.toBoolean(process.env["TYPEORM_DROP_SCHEMA"]),
            migrationsRun: OrmUtils.toBoolean(process.env["TYPEORM_MIGRATIONS_RUN"]),
            entities: this.stringToArray(process.env["TYPEORM_ENTITIES"]),
            migrations: this.stringToArray(process.env["TYPEORM_MIGRATIONS"]),
            migrationsTableName: process.env["TYPEORM_MIGRATIONS_TABLE_NAME"],
            subscribers: this.stringToArray(process.env["TYPEORM_SUBSCRIBERS"]),
            logging: this.transformLogging(process.env["TYPEORM_LOGGING"]),
            logger: process.env["TYPEORM_LOGGER"],
            entityPrefix: process.env["TYPEORM_ENTITY_PREFIX"],
            maxQueryExecutionTime: process.env["TYPEORM_MAX_QUERY_EXECUTION_TIME"],
            debug: process.env["TYPEORM_DEBUG"],
            cli: {
                entitiesDir: process.env["TYPEORM_ENTITIES_DIR"],
                migrationsDir: process.env["TYPEORM_MIGRATIONS_DIR"],
                subscribersDir: process.env["TYPEORM_SUBSCRIBERS_DIR"],
            },
            cache: this.transformCaching(),
            uuidExtension: process.env["TYPEORM_UUID_EXTENSION"]
        };
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Transforms logging string into real logging value connection requires.
     */
    protected transformLogging(logging: string): any {
        if (logging === "true" || logging === "TRUE" || logging === "1")
            return true;
        if (logging === "all")
            return "all";

        return this.stringToArray(logging);
    }

    /**
     * Transforms caching option into real caching value option requires.
     */
    protected transformCaching(): boolean | object | undefined {
        const caching = process.env["TYPEORM_CACHE"];
        if (caching === "true" || caching === "TRUE" || caching === "1")
            return true;
        if (caching === "false" || caching === "FALSE" || caching === "0")
            return false;
        if (caching === "redis" || caching === "database")
            return {
                type: caching,
                options: process.env["TYPEORM_CACHE_OPTIONS"] ? JSON.parse(process.env["TYPEORM_CACHE_OPTIONS"]) : undefined,
                alwaysEnabled: process.env["TYPEORM_CACHE_ALWAYS_ENABLED"],
                duration: parseInt(process.env["TYPEORM_CACHE_DURATION"])
            };

        return undefined;
    }

    /**
     * Converts a string which contains multiple elements split by comma into a string array of strings.
     */
    protected stringToArray(variable?: string) {
        if (!variable)
            return [];
        return variable.split(",").map(str => str.trim());
    }

}
