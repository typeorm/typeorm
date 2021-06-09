import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { CapacitorDriver } from "./CapacitorDriver";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { ObjectLiteral } from "../..";

/**
 * Runs queries on a single sqlite database connection.
 */
export class CapacitorQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: CapacitorDriver;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: CapacitorDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    async executeSet(set: { statement: string; values?: any[] }[]) {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError();

        const databaseConnection = await this.connect();

        return databaseConnection.executeSet(set, false);
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError();

        const databaseConnection = await this.connect();

        this.driver.connection.logger.logQuery(query, parameters, this);

        let pResult: Promise<any>;
        const command = query.substr(0, query.indexOf(" "));

        if (
            ["BEGIN", "ROLLBACK", "COMMIT", "CREATE", "ALTER", "DROP"].indexOf(
                command
            ) !== -1
        ) {
            pResult = databaseConnection.execute(query, false);
        } else if (["INSERT", "UPDATE", "DELETE"].indexOf(command) !== -1) {
            pResult = databaseConnection
                .run(query, parameters, false)
                .then(
                    ({
                        changes,
                    }: {
                        changes: { changes?: number; lastId?: number };
                    }) => changes.lastId || changes.changes
                );
        } else {
            pResult = databaseConnection
                .query(query, parameters || [])
                .then(({ values }: { values: any[] }) => values);
        }

        return pResult.catch((err: any) => {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this
            );
            throw new QueryFailedError(query, parameters, err);
        });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map((key) => `"${key}"` + "=?");
    }
}
