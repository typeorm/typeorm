import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { SqljsDriver } from "./SqljsDriver";
/**
 * Runs queries on a single sqlite database connection.
 */
export declare class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Flag to determine if a modification has happened since the last time this query runner has requested a save.
     */
    private isDirty;
    /**
     * Database driver used by connection.
     */
    driver: SqljsDriver;
    constructor(driver: SqljsDriver);
    /**
     * Called before migrations are run.
     */
    beforeMigration(): Promise<void>;
    /**
     * Called after migrations are run.
     */
    afterMigration(): Promise<void>;
    private flush;
    release(): Promise<void>;
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction(): Promise<void>;
    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[], useStructuredResult?: boolean): Promise<any>;
}
