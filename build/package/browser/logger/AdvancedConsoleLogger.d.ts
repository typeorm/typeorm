import { LoggerOptions } from "./LoggerOptions";
import { QueryRunner } from "../query-runner/QueryRunner";
import { Logger } from "./Logger";
/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and use syntax highlighting.
 */
export declare class AdvancedConsoleLogger implements Logger {
    private options?;
    constructor(options?: LoggerOptions | undefined);
    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void;
    /**
     * Logs query that is failed.
     */
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): void;
    /**
     * Logs query that is slow.
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void;
    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner): void;
    /**
     * Logs events from the migration run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner): void;
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): void;
    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefore we are handle this case too.
     */
    protected stringifyParams(parameters: any[]): string | any[];
}
