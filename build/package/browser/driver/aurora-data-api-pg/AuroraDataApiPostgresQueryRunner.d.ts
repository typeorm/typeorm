import { QueryRunner } from "../../query-runner/QueryRunner";
import { IsolationLevel } from "../types/IsolationLevel";
import { AuroraDataApiPostgresDriver } from "./AuroraDataApiPostgresDriver";
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner";
import { ReplicationMode } from "../types/ReplicationMode";
declare class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any;
    constructor(driver: any, mode: ReplicationMode);
}
/**
 * Runs queries on a single postgres database connection.
 */
export declare class AuroraDataApiPostgresQueryRunner extends PostgresQueryRunnerWrapper implements QueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: AuroraDataApiPostgresDriver;
    protected client: any;
    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;
    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;
    constructor(driver: AuroraDataApiPostgresDriver, client: any, mode: ReplicationMode);
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
    query(query: string, parameters?: any[]): Promise<any>;
}
export {};
