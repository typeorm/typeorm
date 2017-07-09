import {LoggerOptions} from "./LoggerOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {QueryRunner} from "../query-runner/QueryRunner";
import * as debug from "debug";
const chalk = require("chalk");

/**
 * Performs logging of the events in TypeORM.
 *
 * todo: implement logging of too long running queries (there should be option to control max query execution time)
 */
export class Logger {

    private schemaLogger = debug("typeorm:schema");
    private queryLogger = debug("typeorm:query");
    private defaultLogger = debug("typeorm:log");
    private infoLogger = debug("typeorm:info");
    private warnLogger = debug("typeorm:warn");
    private errorLogger = debug("typeorm:error");

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
        this.log("query", query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : ""), queryRunner);
    }

    /**
     * Logs query that failed.
     */
    logFailedQuery(query: string, parameters: any[]|undefined, queryRunner?: QueryRunner) {
        this.log("error", `query failed: ${query}${parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : ""}`, queryRunner);
    }

    /**
     * Logs failed query's error.
     */
    logQueryError(error: any, queryRunner?: QueryRunner) {
        this.log("error", "error during executing query:" + error, queryRunner);
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        this.log("schema-build", message, queryRunner);
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "query"|"schema-build"|"log"|"info"|"warn"|"error", message: any, queryRunner?: QueryRunner) {
        if (this.options && this.options.logger) {
            this.options.logger(level, message, queryRunner);

        } else {
            switch (level) {
                case "schema-build":
                    this.schemaLogger(chalk.underline(message));
                    break;
                case "query":
                    this.queryLogger(`${chalk.gray.underline("executing query")} : ${PlatformTools.highlightSql(message)}`);
                    break;
                case "log":
                    this.defaultLogger(message);
                    break;
                case "info":
                    this.infoLogger(message);
                    break;
                case "warn":
                    this.warnLogger(message);
                    break;
                case "error":
                    this.errorLogger(message);
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