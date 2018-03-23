import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {OrmUtils} from "../../util/OrmUtils";
import {InsertResult} from "../InsertResult";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {SqljsDriver} from "./SqljsDriver";

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    
    /**
     * Database driver used by connection.
     */
    driver: SqljsDriver;
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqljsDriver) {
        super(driver);
        this.driver = driver;
        this.connection = driver.connection;
    }

    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------
    
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        await super.commitTransaction();
        await this.driver.autoSave();
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            try {
                const statement = databaseConnection.prepare(query);
                statement.bind(parameters);
                
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
                ok(result);
            }
            catch (e) {
                fail(e);
            }
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key) => "?").join(",");
        const generatedColumns = this.connection.hasMetadata(tableName) ? this.connection.getMetadata(tableName).generatedColumns : [];
        const sql = columns.length > 0 ? (`INSERT INTO "${tableName}"(${columns}) VALUES (${values})`) : `INSERT INTO "${tableName}" DEFAULT VALUES`;
        const parameters = keys.map(key => keyValues[key]);

        return new Promise<InsertResult>(async (ok, fail) => {
            this.driver.connection.logger.logQuery(sql, parameters, this);
            const databaseConnection = await this.connect();
            try {
                const statement = databaseConnection.prepare(sql);
                statement.bind(parameters);
                statement.step();
                
                const generatedMap = generatedColumns.reduce((map, generatedColumn) => {
                    let value = keyValues[generatedColumn.databaseName];
                    // seems to be the only way to get the inserted id, see https://github.com/kripken/sql.js/issues/77
                    if (generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment") {
                        value = databaseConnection.exec("SELECT last_insert_rowid()")[0].values[0][0];
                    }
                    
                    if (!value) return map;
                    return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
                }, {} as ObjectLiteral);

                if (!this.isTransactionActive) {
                    await this.driver.autoSave();
                }
                
                ok({
                    result: undefined,
                    generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
                });
            }
            catch (e) {
                fail(e);
            }
        });
    }

    /**
     * Updates rows that match given conditions in the given table.
     * Calls AbstractSqliteQueryRunner.update() and runs autoSave if update() was not called in a transaction.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        await super.update(tableName, valuesMap, conditions);
        
        if (!this.isTransactionActive) {
            await this.driver.autoSave();
        }
    }

    /**
     * Deletes from the given table by a given conditions.
     * Calls AbstractSqliteQueryRunner.delete() and runs autoSave if delete() was not called in a transaction.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        await super.delete(tableName, conditions, maybeParameters);
        
        if (!this.isTransactionActive) {
            await this.driver.autoSave();
        }
    }
}