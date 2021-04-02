/**
 * Performs logging of the events in TypeORM.
 * This version of logger logs everything into ormlogs.log file.
 */
export declare class DummyLogger {
    /**
     * Logs query and parameters used in it.
     */
    logQuery(): void;
    /**
     * Logs query that is failed.
     */
    logQueryError(): void;
    /**
     * Logs query that is slow.
     */
    logQuerySlow(): void;
    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(): void;
    /**
     * Logs events from the migrations run process.
     */
    logMigration(): void;
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(): void;
}
export declare class FileLogger extends DummyLogger {
}
