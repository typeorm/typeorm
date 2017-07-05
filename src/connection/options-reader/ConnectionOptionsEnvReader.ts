import {ConnectionOptions} from "../ConnectionOptions";
import {PlatformTools} from "../../platform/PlatformTools";
import {OrmUtils} from "../../util/OrmUtils";

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
            type: PlatformTools.getEnvVariable("TYPEORM_CONNECTION"),
            url: PlatformTools.getEnvVariable("TYPEORM_URL"),
            host: PlatformTools.getEnvVariable("TYPEORM_HOST"),
            port: PlatformTools.getEnvVariable("TYPEORM_PORT"),
            username: PlatformTools.getEnvVariable("TYPEORM_USERNAME"),
            password: PlatformTools.getEnvVariable("TYPEORM_PASSWORD"),
            database: PlatformTools.getEnvVariable("TYPEORM_DATABASE"),
            sid: PlatformTools.getEnvVariable("TYPEORM_SID"),
            extra: PlatformTools.getEnvVariable("TYPEORM_DRIVER_EXTRA") ? JSON.parse(PlatformTools.getEnvVariable("TYPEORM_DRIVER_EXTRA")) : undefined,
            autoSchemaSync: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_AUTO_SCHEMA_SYNC")),
            entities: PlatformTools.getEnvVariable("TYPEORM_ENTITIES") ? PlatformTools.getEnvVariable("TYPEORM_ENTITIES").split(",") : [],
            migrations: PlatformTools.getEnvVariable("TYPEORM_MIGRATIONS") ? PlatformTools.getEnvVariable("TYPEORM_MIGRATIONS").split(",") : [],
            subscribers: PlatformTools.getEnvVariable("TYPEORM_SUBSCRIBERS") ? PlatformTools.getEnvVariable("TYPEORM_SUBSCRIBERS").split(",") : [],
            entitySchemas: PlatformTools.getEnvVariable("TYPEORM_ENTITY_SCHEMAS") ? PlatformTools.getEnvVariable("TYPEORM_ENTITY_SCHEMAS").split(",") : [],
            logging: {
                logQueries: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_QUERIES")),
                logFailedQueryError: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_FAILED_QUERIES")),
                logOnlyFailedQueries: OrmUtils.toBoolean(PlatformTools.getEnvVariable("TYPEORM_LOGGING_ONLY_FAILED_QUERIES")),
            },
            cli: {
                entitiesDir: PlatformTools.getEnvVariable("TYPEORM_ENTITIES_DIR"),
                migrationsDir: PlatformTools.getEnvVariable("TYPEORM_MIGRATIONS_DIR"),
                subscribersDir: PlatformTools.getEnvVariable("TYPEORM_SUBSCRIBERS_DIR"),
            }
        };
    }

}
