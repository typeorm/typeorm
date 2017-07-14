import {LoggerOptions} from "./LoggerOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {QueryRunner} from "../query-runner/QueryRunner";
const chalk = require("chalk");

/**
 * Performs logging of the events in TypeORM.
 *
 * todo: implement logging of too long running queries (there should be option to control max query execution time)
 */
export class Logger {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private options: LoggerOptions) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters: any[]|undefined, queryRunner?: QueryRunner) {
        if (this.options.logQueries ||
            PlatformTools.getEnvVariable("LOGGER_CLI_SCHEMA_SYNC")) {
            this.log("query", query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : ""), queryRunner);
        }
    }

    /**
     * Logs query that failed.
     */
    logFailedQuery(query: string, parameters: any[]|undefined, queryRunner?: QueryRunner) {
        if (this.options.logQueries ||
            this.options.logOnlyFailedQueries ||
            PlatformTools.getEnvVariable("LOGGER_CLI_SCHEMA_SYNC"))
            this.log("error", `query failed: ${query}${parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : ""}`, queryRunner);
    }

    /**
     * Logs failed query's error.
     */
    logQueryError(error: any, queryRunner?: QueryRunner) {
        if (this.options.logFailedQueryError ||
            PlatformTools.getEnvVariable("LOGGER_CLI_SCHEMA_SYNC"))
            this.log("error", "error during executing query:" + error, queryRunner);
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (this.options.logSchemaCreation ||
            PlatformTools.getEnvVariable("LOGGER_CLI_SCHEMA_SYNC"))
            this.log("schema-build", message, queryRunner);
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "query"|"schema-build"|"log"|"info"|"warn"|"error", message: any, queryRunner?: QueryRunner) {
        if (!this.options) return;

        if (this.options.logger) {
            this.options.logger(level, message, queryRunner);

        } else {
            switch (level) {
                case "schema-build":
                    console.log(chalk.underline(message));
                    break;
                case "query":
                    console.log(chalk.gray.underline("executing query") + ": " + PlatformTools.highlightSql(message));
                    break;
                case "log":
                    console.log(message);
                    break;
                case "info":
                    console.info(message);
                    break;
                case "warn":
                    console.warn(message);
                    break;
                case "error":
                    console.error(message);
                    break;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    protected stringifyParams(parameters: any[]) {
        try {
            return JSON.stringify(parameters);

        } catch (error) { // most probably circular objects in parameters
            return parameters;
        }
    }

}