import { QueryRunner } from "../../query-runner/QueryRunner";
import { IsolationLevel } from "../types/IsolationLevel";
import { AuroraPostgresDriver } from "./AuroraPostgresDriver";
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner";
import { ReplicationMode } from "../types/ReplicationMode";
declare class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any;
    constructor(driver: any, mode: ReplicationMode);
}
/**
 * Runs queries on a single postgres database connection.
 */
export declare class AuroraPostgresQueryRunner extends PostgresQueryRunnerWrapper implements QueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: AuroraPostgresDriver;
    protected client: any;
    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;
    constructor(driver: AuroraPostgresDriver, client: any, mode: ReplicationMode);
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any>;
    /**
     * Starts transaction on the current connection.
     */
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction(): Promise<void>;
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction(): Promise<void>;
    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[], useStructuredResult?: boolean): Promise<any>;
}
export {};
