import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { QueryResult } from "../../query-runner/QueryResult";
/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.stmtCache = new Map();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        if (typeof this.driver.options.statementCacheSize === "number") {
            this.cacheSize = this.driver.options.statementCacheSize;
        }
        else {
            this.cacheSize = 100;
        }
    }
    async getStmt(query) {
        if (this.cacheSize > 0) {
            let stmt = this.stmtCache.get(query);
            if (!stmt) {
                const databaseConnection = await this.connect();
                stmt = databaseConnection.prepare(query);
                this.stmtCache.set(query, stmt);
                while (this.stmtCache.size > this.cacheSize) {
                    // since es6 map keeps the insertion order,
                    // it comes to be FIFO cache
                    const key = this.stmtCache.keys().next().value;
                    this.stmtCache.delete(key);
                }
            }
            return stmt;
        }
        else {
            const databaseConnection = await this.connect();
            return databaseConnection.prepare(query);
        }
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
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        const connection = this.driver.connection;
        parameters = parameters || [];
        for (let i = 0; i < parameters.length; i++) {
            // in "where" clauses the parameters are not escaped by the driver
            if (typeof parameters[i] === "boolean")
                parameters[i] = +parameters[i];
        }
        this.driver.connection.logger.logQuery(query, parameters, this);
        const queryStartTime = +new Date();
        const stmt = await this.getStmt(query);
        try {
            const result = new QueryResult();
            if (stmt.reader) {
                const raw = stmt.all.apply(stmt, parameters);
                result.raw = raw;
                if (Array.isArray(raw)) {
                    result.records = raw;
                }
            }
            else {
                const raw = stmt.run.apply(stmt, parameters);
                result.affected = raw.changes;
                result.raw = raw.lastInsertRowid;
            }
            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
            const queryEndTime = +new Date();
            const queryExecutionTime = queryEndTime - queryStartTime;
            if (maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime)
                connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
            if (!useStructuredResult) {
                return result.raw;
            }
            return result;
        }
        catch (err) {
            connection.logger.logQueryError(err, query, parameters, this);
            throw new QueryFailedError(query, parameters, err);
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    async loadTableRecords(tablePath, tableOrIndex) {
        const [database, tableName] = this.splitTablePath(tablePath);
        const res = await this.query(`SELECT ${database ? `'${database}'` : null} as database, * FROM ${this.escapePath(`${database ? `${database}.` : ""}sqlite_master`)} WHERE "type" = '${tableOrIndex}' AND "${tableOrIndex === "table" ? "name" : "tbl_name"}" IN ('${tableName}')`);
        return res;
    }
    async loadPragmaRecords(tablePath, pragma) {
        const [database, tableName] = this.splitTablePath(tablePath);
        const res = await this.query(`PRAGMA ${database ? `"${database}".` : ""}${pragma}("${tableName}")`);
        return res;
    }
}

//# sourceMappingURL=BetterSqlite3QueryRunner.js.map
