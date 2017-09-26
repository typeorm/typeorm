import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {OrmUtils} from "../../util/OrmUtils";
import {InsertResult} from "../InsertResult";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {WebsqlDriver} from "./WebsqlDriver";

/**
 * Declare a global function that is only available in browsers that support WebSQL.
 */
declare function openDatabase(...params: any[]): any;

/**
 * Runs queries on a single websql database connection.
 */
export class WebsqlQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Database driver used by connection.
     */
    driver: WebsqlDriver;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: WebsqlDriver) {
        super(driver);

        this.driver = driver;
        this.connection = driver.connection;
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

        const options = Object.assign({}, {
            database: this.driver.options.database,
        }, this.driver.options.extra || {});

        this.databaseConnectionPromise = new Promise<void>((ok, fail) => {
            this.databaseConnection = openDatabase(
                options.database,
                options.version,
                options.description,
                options.size,
            );
            ok(this.databaseConnection);
        });

        return this.databaseConnectionPromise;
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        // await this.query("BEGIN TRANSACTION");
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        // await this.query("COMMIT");
        this.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        // await this.query("ROLLBACK");
        this.isTransactionActive = false;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const db = await this.connect();
                // todo(dima): check if transaction is not active

                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();

                db.transaction((tx: any) => {
                    tx.executeSql(query, parameters, (tx: any, result: any) => {

                        // log slow queries if maxQueryExecution time is set
                        const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                        const queryEndTime = +new Date();
                        const queryExecutionTime = queryEndTime - queryStartTime;
                        if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                            this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                        const rows = Object
                            .keys(result.rows)
                            .filter(key => key !== "length")
                            .map(key => result.rows[key]);
                        ok(rows);

                    }, (tx: any, err: any) => {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        return fail(new QueryFailedError(query, parameters, err));
                    });
                });

            } catch (err) {
                fail(err);
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
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const generatedColumns = this.connection.hasMetadata(tableName) ? this.connection.getMetadata(tableName).generatedColumns : [];
        const sql = columns.length > 0 ? (`INSERT INTO "${tableName}"(${columns}) VALUES (${values})`) : `INSERT INTO "${tableName}" DEFAULT VALUES`;
        const parameters = keys.map(key => keyValues[key]);

        return new Promise<InsertResult>(async (ok, fail) => {
            this.driver.connection.logger.logQuery(sql, parameters, this);

            const db = await this.connect();
            // todo: check if transaction is not active
            db.transaction((tx: any) => {
                tx.executeSql(sql, parameters, (tx: any, result: any) => {
                    const generatedMap = generatedColumns.reduce((map, generatedColumn) => {
                        const value = generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment" && result["insertId"] ? result["insertId"] : keyValues[generatedColumn.databaseName];
                        if (!value) return map;
                        return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
                    }, {} as ObjectLiteral);

                    ok({
                        result: undefined,
                        generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
                    });

                }, (tx: any, err: any) => {
                    this.driver.connection.logger.logQueryError(err, sql, parameters, this);
                    return fail(err);
                });
            });
        });
    }

    // TODO: finish the table schema loading
    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async getTables(tableNames: string[]): Promise<TableSchema[]> {

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");

        // load tables, columns, indices and foreign keys
        const dbTables: ObjectLiteral[] = await this.query(`SELECT * FROM sqlite_master WHERE type = 'table' AND name IN (${tableNamesString})`);

        // if tables were not found in the db, no need to proceed
        if (!dbTables || !dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const tableSchema = new TableSchema(dbTable["name"]);

            // load columns and indices
            /*const [dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
                this.query(`PRAGMA table_info("${dbTable["name"]}")`),
                this.query(`PRAGMA index_list("${dbTable["name"]}")`),
                this.query(`PRAGMA foreign_key_list("${dbTable["name"]}")`),
            ]);

            // find column name with auto increment
            let autoIncrementColumnName: string|undefined = undefined;
            const tableSql: string = dbTable["sql"];
            if (tableSql.indexOf("AUTOINCREMENT") !== -1) {
                autoIncrementColumnName = tableSql.substr(0, tableSql.indexOf("AUTOINCREMENT"));
                const comma = autoIncrementColumnName.lastIndexOf(",");
                const bracket = autoIncrementColumnName.lastIndexOf("(");
                if (comma !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(comma);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);

                } else if (bracket !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(bracket);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);
                }
            }

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns.map(dbColumn => {
                const columnSchema = new ColumnSchema();
                columnSchema.name = dbColumn["name"];
                columnSchema.type = dbColumn["type"].toLowerCase();
                columnSchema.default = dbColumn["dflt_value"] !== null && dbColumn["dflt_value"] !== undefined ? dbColumn["dflt_value"] : undefined;
                columnSchema.isNullable = dbColumn["notnull"] === 0;
                columnSchema.isPrimary = dbColumn["pk"] === 1;
                columnSchema.comment = ""; // todo later
                columnSchema.isGenerated = autoIncrementColumnName === dbColumn["name"];
                const columnForeignKeys = dbForeignKeys
                    .filter(foreignKey => foreignKey["from"] === dbColumn["name"])
                    .map(foreignKey => {
                        const keyName = namingStrategy.foreignKeyName(dbTable["name"], [foreignKey["from"]], foreignKey["table"], [foreignKey["to"]]);
                        return new ForeignKeySchema(keyName, [foreignKey["from"]], [foreignKey["to"]], foreignKey["table"], foreignKey["on_delete"]); // todo: how sqlite return from and to when they are arrays? (multiple column foreign keys)
                    });
                tableSchema.addForeignKeys(columnForeignKeys);
                return columnSchema;
            });

            // create primary key schema
            await Promise.all(dbIndices
                .filter(index => index["origin"] === "pk")
                .map(async index => {
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${index["name"]}")`);
                    const indexColumns = indexInfos.map(indexInfo => indexInfo["name"]);
                    indexColumns.forEach(indexColumn => {
                        tableSchema.primaryKeys.push(new PrimaryKeySchema(index["name"], indexColumn));
                    });
                }));

            // create index schemas from the loaded indices
            const indicesPromises = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["origin"] !== "pk" &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["name"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["name"]));
                })
                .map(dbIndex => dbIndex["name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(async dbIndexName => {
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${dbIndex!["name"]}")`);
                    const indexColumns = indexInfos.map(indexInfo => indexInfo["name"]);

                    // check if db index is generated by sqlite itself and has special use case
                    if (dbIndex!["name"].substr(0, "sqlite_autoindex".length) === "sqlite_autoindex") {
                        if (dbIndex!["unique"] === 1) { // this means we have a special index generated for a column
                            // so we find and update the column
                            indexColumns.forEach(columnName => {
                                const column = tableSchema.columns.find(column => column.name === columnName);
                                if (column)
                                    column.isUnique = true;
                            });
                        }

                        return Promise.resolve(undefined);

                    } else {
                        return new IndexSchema(dbTable["name"], dbIndex!["name"], indexColumns, dbIndex!["unique"] === "1");
                    }
                });

            const indices = await Promise.all(indicesPromises);
            tableSchema.indices = indices.filter(index => !!index) as IndexSchema[];*/

            return tableSchema;
        }));
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        // await this.query(`PRAGMA foreign_keys = OFF;`);
        await this.startTransaction();
        try {
            const selectDropsQuery = `select 'drop table "' || name || '";' as query from sqlite_master where type = 'table' and name != 'sqlite_sequence'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));
            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;

            // await this.query(`PRAGMA foreign_keys = ON;`);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema): string {
        let c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata) {
            c += " " + this.driver.normalizeType(column);
        } else {
            c += " " + this.connection.driver.createFullType(column);
        }
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isUnique === true)
            c += " UNIQUE";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " PRIMARY KEY AUTOINCREMENT";
        if (column.default !== undefined && column.default !== null) // todo: same code in all drivers. make it DRY
            c += ` DEFAULT ${column.default}`;

        return c;
    }
}