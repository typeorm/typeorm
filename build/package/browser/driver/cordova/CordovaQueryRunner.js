import { __awaiter } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
/**
 * Runs queries on a single sqlite database connection.
 */
export class CordovaQueryRunner extends AbstractSqliteQueryRunner {
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
     * Executes a given SQL query.
     */
    query(query, parameters) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        return new Promise((ok, fail) => __awaiter(this, void 0, void 0, function* () {
            const databaseConnection = yield this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            databaseConnection.executeSql(query, parameters, (result) => {
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
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
            }, (err) => {
                this.driver.connection.logger.logQueryError(err, query, parameters, this);
                fail(new QueryFailedError(query, parameters, err));
            });
        }));
    }
    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     // todo: implement new syntax
    async insert(tableName: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map(key => "?").join(",");
        const generatedColumns = this.connection.hasMetadata(tableName) ? this.connection.getMetadata(tableName).generatedColumns : [];
        const sql = columns.length > 0 ? (`INSERT INTO "${tableName}"(${columns}) VALUES (${values})`) : `INSERT INTO "${tableName}" DEFAULT VALUES`;
        const parameters = keys.map(key => keyValues[key]);

        return new Promise<InsertResult>(async (ok, fail) => {
            this.driver.connection.logger.logQuery(sql, parameters, this);
            const __this = this;
            const databaseConnection = await this.connect();
            databaseConnection.executeSql(sql, parameters, (resultSet: any) => {
                const generatedMap = generatedColumns.reduce((map, generatedColumn) => {
                    const value = generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment" && resultSet.insertId ? resultSet.insertId : keyValues[generatedColumn.databaseName];
                    if (!value) return map;
                    return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
                }, {} as ObjectLiteral);

                ok({
                    result: undefined,
                    generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
                });
            }, (err: any) => {
                __this.driver.connection.logger.logQueryError(err, sql, parameters, this);
                fail(err);
            });
        });
    }*/
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    parametrize(objectLiteral, startIndex = 0) {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}

//# sourceMappingURL=CordovaQueryRunner.js.map
