import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { QueryResult } from "../../query-runner/QueryResult";
/**
 * Runs queries on a single sqlite database connection.
 */
export class CapacitorQueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }
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
    async executeSet(set) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        const databaseConnection = await this.connect();
        return databaseConnection.executeSet(set, false);
    }
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);
        const command = query.substr(0, query.indexOf(" "));
        try {
            let raw;
            if ([
                "BEGIN",
                "ROLLBACK",
                "COMMIT",
                "CREATE",
                "ALTER",
                "DROP",
            ].indexOf(command) !== -1) {
                raw = await databaseConnection.execute(query, false);
            }
            else if (["INSERT", "UPDATE", "DELETE"].indexOf(command) !== -1) {
                raw = await databaseConnection.run(query, parameters, false);
            }
            else {
                raw = await databaseConnection.query(query, parameters || []);
            }
            const result = new QueryResult();
            if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("values")) {
                result.raw = raw.values;
                result.records = raw.values;
            }
            if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("changes")) {
                result.affected = raw.changes.changes;
                result.raw = raw.changes.lastId || raw.changes.changes;
            }
            if (!useStructuredResult) {
                return result.raw;
            }
            return result;
        }
        catch (err) {
            this.driver.connection.logger.logQueryError(err, query, parameters, this);
            throw new QueryFailedError(query, parameters, err);
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    parametrize(objectLiteral) {
        return Object.keys(objectLiteral).map((key) => `"${key}"` + "=?");
    }
}

//# sourceMappingURL=CapacitorQueryRunner.js.map
