import { Logger } from "./Logger";
import { QueryRunner } from "../";
/**
 * Performs logging of the events in TypeORM via debug library.
 */
export declare class DebugLogger implements Logger {
    private debug;
    private debugQueryLog;
    private debugQueryError;
    private debugQuerySlow;
    private debugSchemaBuild;
    private debugMigration;
    private debugLog;
    private debugInfo;
    private debugWarn;
    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void;
    /**
     * Logs query that failed.
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
     * Perform logging using given logger.
     * Log has its own level and message.
     */
    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): void;
}
