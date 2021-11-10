import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {IsolationLevel} from "../types/IsolationLevel";
import {AuroraDataApiPostgresDriver} from "./AuroraDataApiPostgresDriver";
import {PostgresQueryRunner} from "../postgres/PostgresQueryRunner";
import {ReplicationMode} from "../types/ReplicationMode";
import { QueryResult } from "../../query-runner/QueryResult";

class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any;

    constructor(driver: any, mode: ReplicationMode) {
        super(driver, mode);
    }
}

/**
 * Runs queries on a single postgres database connection.
 */
export class AuroraDataApiPostgresQueryRunner extends PostgresQueryRunnerWrapper implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: AuroraDataApiPostgresDriver;

    protected client: any;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: AuroraDataApiPostgresDriver, client: any, mode: ReplicationMode) {
        super(driver, mode);

        this.client = client
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated)  {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([ connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        await this.broadcaster.broadcast('BeforeTransactionStart')

        this.isTransactionActive = true;

        await this.client.startTransaction();

        await this.broadcaster.broadcast('AfterTransactionStart')
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionCommit');

        await this.client.commitTransaction();

        this.isTransactionActive = false;

        await this.broadcaster.broadcast('AfterTransactionCommit');
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.broadcaster.broadcast('BeforeTransactionRollback');

        await this.client.rollbackTransaction();

        await this.broadcaster.broadcast('AfterTransactionRollback');
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[], useStructuredResult = false): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const raw = await this.client.query(query, parameters);

        const result = new QueryResult();

        result.raw = raw;

        if (raw?.hasOwnProperty('records') && Array.isArray(raw.records)) {
            result.records = raw.records;
        }

        if (raw?.hasOwnProperty('numberOfRecordsUpdated')) {
            result.affected = raw.numberOfRecordsUpdated;
        }

        if (!useStructuredResult) {
            return result.raw;
        }

        return result;
    }
}
