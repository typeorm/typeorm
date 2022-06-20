import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { BetterSqlite3Driver } from "./BetterSqlite3Driver";
/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export declare class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: BetterSqlite3Driver;
    constructor(driver: BetterSqlite3Driver);
    private cacheSize;
    private stmtCache;
    private getStmt;
    /**
     * Called before migrations are run.
     */
    beforeMigration(): Promise<void>;
    /**
     * Called after migrations are run.
     */
    afterMigration(): Promise<void>;
    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[], useStructuredResult?: boolean): Promise<any>;
    protected loadTableRecords(tablePath: string, tableOrIndex: "table" | "index"): Promise<any>;
    protected loadPragmaRecords(tablePath: string, pragma: string): Promise<any>;
}
