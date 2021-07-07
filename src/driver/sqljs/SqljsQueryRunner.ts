import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {SqljsDriver} from "./SqljsDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {QueryFailedError} from "../../error/QueryFailedError";

/**
 * Runs queries on a single sqlite database connection.
 */
export class SqljsQueryRunner extends AbstractSqliteQueryRunner {

    /**
     * Flag to determine if a modification has happened since the last time this query runner has requested a save.
     */
    private isDirty = false;

    /**
     * Database driver used by connection.
     */
    driver: SqljsDriver;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqljsDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

    private async flush() {
        if (this.isDirty) {
            await this.driver.autoSave();
            this.isDirty = false;
        }
    }

    async release(): Promise<void> {
        await this.flush();
        return super.release();
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        await super.commitTransaction();
        await this.flush();
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters: any[] = []): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const command = query.trim().split(" ", 1)[0];

        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = this.driver.databaseConnection;
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            let statement: any;
            try {
                statement = databaseConnection.prepare(query);
                if (parameters) {
                    parameters = parameters.map(p => typeof p !== 'undefined' ? p : null);

                    statement.bind(parameters);
                }

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                const result: any[] = [];

                while (statement.step()) {
                    result.push(statement.getAsObject());
                }

                statement.free();

                if (command !== "SELECT") {
                    this.isDirty = true;
                }

                ok(result);
            }
            catch (e) {
                if (statement) {
                    statement.free();
                }

                this.driver.connection.logger.logQueryError(e, query, parameters, this);
                fail(new QueryFailedError(query, parameters, e));
            }
        });
    }
}
