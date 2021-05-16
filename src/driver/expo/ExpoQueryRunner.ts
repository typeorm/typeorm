import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ExpoDriver} from "./ExpoDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {BroadcasterResult} from "../../subscriber/BroadcasterResult";

// Needed to satisfy the Typescript compiler
interface IResultSet {
    insertId: number | undefined;
    rowsAffected: number;
    rows: {
        length: number;
        item: (idx: number) => any;
        _array: any[];
    };
}
interface ITransaction {
    executeSql: (
        sql: string,
        args: any[] | undefined,
        ok: (tsx: ITransaction, resultSet: IResultSet) => void,
        fail: (tsx: ITransaction, err: any) => void
    ) => void;
}

/**
 * Runs queries on a single sqlite database connection.
 */
export class ExpoQueryRunner extends AbstractSqliteQueryRunner {

    /**
     * Database driver used by connection.
     */
    driver: ExpoDriver;

    /**
     * Database transaction object
     */
    private transaction?: ITransaction;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: ExpoDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    /**
     * Starts transaction. Within Expo, all database operations happen in a
     * transaction context, so issuing a `BEGIN TRANSACTION` command is
     * redundant and will result in the following error:
     *
     * `Error: Error code 1: cannot start a transaction within a transaction`
     *
     * Instead, we keep track of a `Transaction` object in `this.transaction`
     * and continue using the same object until we wish to commit the
     * transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive && typeof this.transaction !== "undefined")
            throw new TransactionAlreadyStartedError();

        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        this.isTransactionActive = true;

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     * Since Expo will automatically commit the transaction once all the
     * callbacks of the transaction object have been completed, "committing" a
     * transaction in this driver's context means that we delete the transaction
     * object and set the stage for the next transaction.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        this.isTransactionActive = false;
        this.transaction = undefined;

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     * This method's functionality is identical to `commitTransaction()` because
     * the transaction lifecycle is handled within the Expo transaction object.
     * Issuing separate statements for `COMMIT` or `ROLLBACK` aren't necessary.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive && typeof this.transaction === "undefined")
            throw new TransactionNotStartedError();

        const beforeBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
        if (beforeBroadcastResult.promises.length > 0) await Promise.all(beforeBroadcastResult.promises);

        this.isTransactionActive = false;
        this.transaction = undefined;

        const afterBroadcastResult = new BroadcasterResult();
        this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
        if (afterBroadcastResult.promises.length > 0) await Promise.all(afterBroadcastResult.promises);
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            // All Expo SQL queries are executed in a transaction context
            databaseConnection.transaction((transaction: ITransaction) => {
                if (typeof this.transaction === "undefined") {
                    this.startTransaction();
                    this.transaction = transaction;
                }
                this.transaction.executeSql(query, parameters, (t: ITransaction, result: IResultSet) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    }

                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        ok(result.insertId);
                    }
                    else {
                        let resultSet = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            resultSet.push(result.rows.item(i));
                        }
                        ok(resultSet);
                    }
                }, (t: ITransaction, err: any) => {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                });
            }, (err: any) => {
                this.rollbackTransaction();
            }, () => {
                this.isTransactionActive = false;
                this.transaction = undefined;
            });
        });
    }
}
