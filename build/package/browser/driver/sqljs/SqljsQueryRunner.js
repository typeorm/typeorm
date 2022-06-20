import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { QueryFailedError } from "../../error/QueryFailedError";
import { QueryResult } from "../../query-runner/QueryResult";
/**
 * Runs queries on a single sqlite database connection.
 */
export class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        /**
         * Flag to determine if a modification has happened since the last time this query runner has requested a save.
         */
        this.isDirty = false;
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }
    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------
    /**
     * Called before migrations are run.
     */
    async beforeMigration() {
        await this.query(`PRAGMA foreign_keys = OFF`);
    }
    /**
     * Called after migrations are run.
     */
    async afterMigration() {
        await this.query(`PRAGMA foreign_keys = ON`);
    }
    async flush() {
        if (this.isDirty) {
            await this.driver.autoSave();
            this.isDirty = false;
        }
    }
    async release() {
        await this.flush();
        return super.release();
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction() {
        await super.commitTransaction();
        await this.flush();
    }
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters = [], useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        const command = query.trim().split(" ", 1)[0];
        const databaseConnection = this.driver.databaseConnection;
        this.driver.connection.logger.logQuery(query, parameters, this);
        const queryStartTime = +new Date();
        let statement;
        try {
            statement = databaseConnection.prepare(query);
            if (parameters) {
                parameters = parameters.map((p) => typeof p !== "undefined" ? p : null);
                statement.bind(parameters);
            }
            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
            const queryEndTime = +new Date();
            const queryExecutionTime = queryEndTime - queryStartTime;
            if (maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime)
                this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
            const records = [];
            while (statement.step()) {
                records.push(statement.getAsObject());
            }
            const result = new QueryResult();
            result.affected = databaseConnection.getRowsModified();
            result.records = records;
            result.raw = records;
            statement.free();
            if (command !== "SELECT") {
                this.isDirty = true;
            }
            if (useStructuredResult) {
                return result;
            }
            else {
                return result.raw;
            }
        }
        catch (e) {
            if (statement) {
                statement.free();
            }
            this.driver.connection.logger.logQueryError(e, query, parameters, this);
            throw new QueryFailedError(query, parameters, e);
        }
    }
}

//# sourceMappingURL=SqljsQueryRunner.js.map
