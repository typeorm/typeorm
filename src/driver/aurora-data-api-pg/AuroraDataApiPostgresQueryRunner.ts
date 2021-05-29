import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {IsolationLevel} from "../types/IsolationLevel";
import {AuroraDataApiPostgresDriver} from "./AuroraDataApiPostgresDriver";
import {PostgresQueryRunner} from "../postgres/PostgresQueryRunner";
import {ReplicationMode} from "../types/ReplicationMode";
import {BroadcasterResult} from "../../subscriber/BroadcasterResult";

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

    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;

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

        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        this.isTransactionActive = true;
      
        await this.client.startTransaction();

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();
      
        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        await this.client.commitTransaction();

        this.isTransactionActive = false;

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        await this.client.rollbackTransaction();

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const result = await this.client.query(query, parameters);

        if (result.records) {
            return result.records;
        }

        return result;
    }
}
