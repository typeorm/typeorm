import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Performs logging of the events in TypeORM.
 */
export interface Logger {

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any;

    /**
     * Logs query that is failed.
     */
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): any;

    /**
     * Logs query that is slow.
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): any;

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner): any;

    /**
     * Logs events from the migrations run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner): any;

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "log"|"info"|"warn", message: any, queryRunner?: QueryRunner): any;

}