import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/schema/TableColumn";
import {Table} from "../../schema-builder/schema/Table";
import {TableForeignKey} from "../../schema-builder/schema/TableForeignKey";
import {TablePrimaryKey} from "../../schema-builder/schema/TablePrimaryKey";
import {TableIndex} from "../../schema-builder/schema/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {SqlServerDriver} from "./SqlServerDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {MssqlParameter} from "./MssqlParameter";
import {EntityManager} from "../../entity-manager/EntityManager";
import {QueryFailedError} from "../../error/QueryFailedError";
import {PromiseUtils} from "../../util/PromiseUtils";
import {Broadcaster} from "../../subscriber/Broadcaster";

/**
 * Runs queries on a single mysql database connection.
 */
export class SqlServerQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: SqlServerDriver;

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster;

    /**
     * Isolated entity manager working only with current query runner.
     */
    manager: EntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    isReleased = false;

    /**
     * Indicates if transaction is in progress.
     */
    isTransactionActive = false;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data = {};

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Last executed query in a transaction.
     * This is needed because in transaction mode mssql cannot execute parallel queries,
     * that's why we store last executed query promise to wait it when we execute next query.
     *
     * @see https://github.com/patriksimek/node-mssql/issues/491
     */
    protected queryResponsibilityChain: Promise<any>[] = [];

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlsInMemory: string[] = [];

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqlServerDriver, mode: "master"|"slave" = "master") {
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        this.mode = mode;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        return new Promise<void>(async (ok, fail) => {
            this.isTransactionActive = true;

            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            this.databaseConnection = pool.transaction();
            this.databaseConnection.begin((err: any) => {
                if (err) {
                    this.isTransactionActive = false;
                    return fail(err);
                }
                ok();
            });
        });
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

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.commit((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
            });
        });
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

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.rollback((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
            });
        });
    }

    protected mssqlParameterToNativeParameter(parameter: MssqlParameter): any {
        switch (this.driver.normalizeType({ type: parameter.type as any })) {
            case "bit":
                return this.driver.mssql.Bit;
            case "bigint":
                return this.driver.mssql.BigInt;
            case "decimal":
                return this.driver.mssql.Decimal(...parameter.params);
            case "float":
                return this.driver.mssql.Float;
            case "int":
                return this.driver.mssql.Int;
            case "money":
                return this.driver.mssql.Money;
            case "numeric":
                return this.driver.mssql.Numeric(...parameter.params);
            case "smallint":
                return this.driver.mssql.SmallInt;
            case "smallmoney":
                return this.driver.mssql.SmallMoney;
            case "real":
                return this.driver.mssql.Real;
            case "tinyint":
                return this.driver.mssql.TinyInt;
            case "char":
                return this.driver.mssql.Char(...parameter.params);
            case "nchar":
                return this.driver.mssql.NChar(...parameter.params);
            case "text":
                return this.driver.mssql.Text;
            case "ntext":
                return this.driver.mssql.Ntext;
            case "varchar":
                return this.driver.mssql.VarChar(...parameter.params);
            case "nvarchar":
                return this.driver.mssql.NVarChar(...parameter.params);
            case "xml":
                return this.driver.mssql.Xml;
            case "time":
                return this.driver.mssql.Time(...parameter.params);
            case "date":
                return this.driver.mssql.Date;
            case "datetime":
                return this.driver.mssql.DateTime;
            case "datetime2":
                return this.driver.mssql.DateTime2(...parameter.params);
            case "datetimeoffset":
                return this.driver.mssql.DateTimeOffset(...parameter.params);
            case "smalldatetime":
                return this.driver.mssql.SmallDateTime;
            case "uniqueidentifier":
                return this.driver.mssql.UniqueIdentifier;
            case "variant":
                return this.driver.mssql.Variant;
            case "binary":
                return this.driver.mssql.Binary;
            case "varbinary":
                return this.driver.mssql.VarBinary(...parameter.params);
            case "image":
                return this.driver.mssql.Image;
            case "udt":
                return this.driver.mssql.UDT;
            case "geography":
                return this.driver.mssql.Geography;
            case "geometry":
                return this.driver.mssql.Geometry;
        }
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise(async (ok, fail) => {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                if (parameters && parameters.length) {
                    parameters.forEach((parameter, index) => {
                        if (parameter instanceof MssqlParameter) {
                            const mssqlParameter = this.mssqlParameterToNativeParameter(parameter);
                            if (mssqlParameter) {
                                request.input(index, mssqlParameter, parameter.value);
                            } else {
                                request.input(index, parameter.value);
                            }
                        } else {
                            request.input(index, parameter);
                        }
                    });
                }
                const queryStartTime = +new Date();
                request.query(query, (err: any, result: any) => {

                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    const resolveChain = () => {
                        if (promiseIndex !== -1)
                            this.queryResponsibilityChain.splice(promiseIndex, 1);
                        if (waitingPromiseIndex !== -1)
                            this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                        waitingOkay();
                    };

                    let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                    let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        resolveChain();
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result.recordset);
                    resolveChain();
                });

            } catch (err) {
                fail(err);
            }
        });
        if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);

        return promise;
    }

    /**
     * Returns raw data stream.
     */
    async stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise<ReadStream>(async (ok, fail) => {

            this.driver.connection.logger.logQuery(query, parameters, this);
            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
            request.stream = true;
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    if (parameter instanceof MssqlParameter) {
                        request.input(index, this.mssqlParameterToNativeParameter(parameter), parameter.value);
                    } else {
                        request.input(index, parameter);
                    }
                });
            }
            request.query(query, (err: any, result: any) => {

                const resolveChain = () => {
                    if (promiseIndex !== -1)
                        this.queryResponsibilityChain.splice(promiseIndex, 1);
                    if (waitingPromiseIndex !== -1)
                        this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                    waitingOkay();
                };

                let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                if (err) {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    resolveChain();
                    return fail(err);
                }

                ok(result.recordset);
                resolveChain();
            });
            if (onEnd) request.on("done", onEnd);
            if (onError) request.on("error", onError);
            ok(request as ReadStream);
        });
        if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);

        return promise;
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) { // todo: escape all parameters there
            sql = `INSERT INTO ${this.escapeTablePath(tablePath)}("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM ${this.escapeTablePath(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTablePath(tablePath)}("ancestor", "descendant") ` +
                `SELECT "ancestor", ${newEntityId} FROM ${this.escapeTablePath(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.escapeTablePath(tablePath)} WHERE descendant = ${parentId}`);
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        } else {
            return -1;
        }
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable(tablePath: string): Promise<Table|undefined> {
        const tables = await this.getTables([tablePath]);
        return tables.length > 0 ? tables[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    async getTables(tablePaths: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (!tablePaths || !tablePaths.length)
            return [];

        const tableNames = tablePaths.map(tablePath => {
            if (tablePath.split(".").length === 3) {
                return tablePath.split(".")[2];
            } else if (tablePath.split(".").length === 2) {
                return tablePath.split(".")[1];
            } else {
                return tablePath;
            }
        });

        let schemaNames: string[] = [];
        tablePaths.filter(tablePath => tablePath.indexOf(".") !== -1)
            .forEach(tablePath => {
                if (tablePath.split(".").length === 3) {
                    if (tablePath.split(".")[1] !== "")
                        schemaNames.push(tablePath.split(".")[1]);
                } else {
                    schemaNames.push(tablePath.split(".")[0]);
                }
            });
        schemaNames.push(this.driver.options.schema || "SCHEMA_NAME()");

        const dbNames = tablePaths
            .filter(tablePath => tablePath.split(".").length === 3)
            .map(tablePath => tablePath.split(".")[0]);
        if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
            dbNames.push(this.driver.database);

        // load tables, columns, indices and foreign keys
        const schemaNamesString = schemaNames.map(name => {
            return name === "SCHEMA_NAME()" ? name : "'" + name + "'";
        }).join(", ");
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");

        const tablesSql = dbNames.map(dbName => {
            return `SELECT * FROM ${dbName}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN (${tableNamesString}) AND TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const columnsSql = dbNames.map(dbName => {
            return `SELECT * FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const constraintsSql = dbNames.map(dbName => {
            return `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM ${dbName}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages ` +
                `LEFT JOIN ${dbName}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME ` +
                `WHERE columnUsages.TABLE_SCHEMA IN (${schemaNamesString}) AND tableConstraints.TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const identityColumnsSql = dbNames.map(dbName => {
            return  `SELECT COLUMN_NAME, TABLE_NAME FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS WHERE COLUMNPROPERTY(object_id(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1 AND TABLE_SCHEMA IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const indicesSql = dbNames.map(dbName => {
            return `SELECT TABLE_NAME = t.name, INDEX_NAME = ind.name, IndexId = ind.index_id, ColumnId = ic.index_column_id, 
                    COLUMN_NAME = col.name, IS_UNIQUE = ind.is_unique, ind.*, ic.*, col.* 
                    FROM ${dbName}.sys.indexes ind 
                    INNER JOIN ${dbName}.sys.index_columns ic ON ind.object_id = ic.object_id and ind.index_id = ic.index_id
                    INNER JOIN ${dbName}.sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id 
                    INNER JOIN ${dbName}.sys.tables t ON ind.object_id = t.object_id WHERE ind.is_primary_key = 0 
                    AND ind.is_unique_constraint = 0 AND t.is_ms_shipped = 0`;
        }).join(" UNION ALL ");
        const [dbTables, dbColumns, dbConstraints, dbIdentityColumns, dbIndices]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(identityColumnsSql),
            this.query(indicesSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table(dbTable["TABLE_NAME"]);

            table.database = dbTable["TABLE_CATALOG"];
            table.schema = dbTable["TABLE_SCHEMA"];

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === table.name)
                .map(dbColumn => {
                    const isPrimary = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === table.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                    });
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return  column["TABLE_NAME"] === table.name &&
                                column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });
                    const isUnique = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === table.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();

                    tableColumn.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString() : "";
                    if (tableColumn.length === "-1")
                        tableColumn.length = "MAX";

                    tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                    tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = isGenerated;
                    if (tableColumn.default === "(newsequentialid())") {
                        tableColumn.isGenerated = true;
                        tableColumn.default = undefined;                        
                    }
                    tableColumn.isUnique = isUnique;
                    tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    tableColumn.collation = dbColumn["COLLATION_NAME"];
                    tableColumn.comment = ""; // todo: less priority, implement this later

                    if (tableColumn.type === "datetime2" || tableColumn.type === "time" || tableColumn.type === "datetimeoffset") {
                        tableColumn.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return tableColumn;
                });

            // create primary key schema
            table.primaryKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === table.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                })
                .map(keyColumnUsage => {
                    return new TablePrimaryKey(keyColumnUsage["CONSTRAINT_NAME"], keyColumnUsage["COLUMN_NAME"]);
                });

            // create foreign key schemas from the loaded indices
            table.foreignKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === table.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "FOREIGN KEY";
                })
                .map(dbConstraint => new TableForeignKey(dbConstraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            table.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["TABLE_NAME"] === table.name &&
                            (!table.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                            (!table.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["TABLE_NAME"] === table.name && dbIndex["INDEX_NAME"] === dbIndexName)
                        .map(dbIndex => dbIndex["COLUMN_NAME"]);

                    const isUnique = !!dbIndices.find(dbIndex => dbIndex["TABLE_NAME"] === table.name && dbIndex["INDEX_NAME"] === dbIndexName && dbIndex["IS_UNIQUE"] === true);
                    return new TableIndex(dbTable["TABLE_NAME"], dbIndexName, columnNames,  isUnique);
                });

            return table;
        }));
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT DB_ID('${database}') as db_id`);
        const dbId = result[0]["db_id"];
        return !!dbId;
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tablePath: string): Promise<boolean> {
        const parsedTablePath = this.parseTablePath(tablePath);
        const sql = `SELECT * FROM ${parsedTablePath.database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${parsedTablePath.schema}' AND TABLE_SCHEMA = '${parsedTablePath.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a database if it's not created.
     */
    createDatabase(database: string): Promise<void[]> {
        return this.query(`IF DB_ID('${database}') IS NULL CREATE DATABASE ${database}`);
    }

    /**
     * Creates a schema if it's not created.
     */
    createSchema(schemaPaths: string[]): Promise<void[]> {
        if (this.driver.options.schema)
            schemaPaths.push(this.driver.options.schema);

        return PromiseUtils.runInSequence(schemaPaths, async path => {
            if (path.indexOf(".") === -1) {
                const query = `IF SCHEMA_ID('${path}') IS NULL BEGIN EXEC sp_executesql N'CREATE SCHEMA ${path}' END`;
                return this.query(query);
            } else {
                const dbName = path.split(".")[0];
                const schema = path.split(".")[1];
                const currentDBQuery = await this.query(`SELECT DB_NAME() AS db_name`);
                const currentDB = currentDBQuery[0]["db_name"];
                await this.query(`USE ${dbName}`);
                const query = `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC sp_executesql N'CREATE SCHEMA ${schema}' END`;
                await this.query(query);
                return this.query(`USE ${currentDB}`);
            }
        });
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: Table): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table.name, column, false, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTablePath(table)} (${columnDefinitions}`;
        sql += table.columns
            .filter(column => column.isUnique)
            .map(column => {
                let constraintName = `${table.name}_${column.name}`;
                const schema = table.schema || this.driver.options.schema;
                if (schema)
                    constraintName = `${schema}_` + constraintName;

                return `, CONSTRAINT "uk_${constraintName}" UNIQUE ("${column.name}")`;
            }).join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Drops the table.
     */
    async dropTable(tablePath: string): Promise<void> {
        await this.query(`DROP TABLE ${this.escapeTablePath(tablePath)}`);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tablePath: string, columnName: string): Promise<boolean> {
        const parsedTablePath = this.parseTablePath(tablePath);
        const sql = `SELECT * FROM ${parsedTablePath.database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${parsedTablePath.tableName}' AND COLUMN_NAME = '${columnName}' AND TABLE_SCHEMA = '${parsedTablePath.schema}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrPath: Table|string, column: TableColumn): Promise<void> {
        const tableName = tableOrPath instanceof Table ? tableOrPath.name : this.parseTablePath(tableOrPath).tableName;
        const sql = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} ADD ${this.buildCreateColumnSql(tableName, column, false, true)}`;
        return this.query(sql);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        let table: Table|undefined = undefined;
        if (tableOrName instanceof Table) {
            table = tableOrName;
        } else {
            table = await this.getTable(tableOrName);
        }

        if (!table)
            throw new Error(`Table ${tableOrName} was not found.`);

        let oldColumn: TableColumn|undefined = undefined;
        if (oldTableColumnOrName instanceof TableColumn) {
            oldColumn = oldTableColumnOrName;
        } else {
            oldColumn = table.columns.find(column => column.name === oldTableColumnOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${tableOrName}" table.`);

        let newColumn: TableColumn|undefined = undefined;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        return this.changeColumn(table, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {

        let table: Table|undefined = undefined;
        if (tableOrName instanceof Table) {
            table = tableOrName;
        } else {
            table = await this.getTable(tableOrName);
        }

        if (!table)
            throw new Error(`Table ${tableOrName} was not found.`);

        let oldColumn: TableColumn|undefined = undefined;
        if (oldTableColumnOrName instanceof TableColumn) {
            oldColumn = oldTableColumnOrName;
        } else {
            oldColumn = table.columns.find(column => column.name === oldTableColumnOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${tableOrName}" table.`);

        // to update an identy column we have to drop column and recreate it again
        if (newColumn.isGenerated !== oldColumn.isGenerated) {
            await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} DROP COLUMN "${newColumn.name}"`);
            await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} ADD ${this.buildCreateColumnSql(table.name, newColumn, false, false)}`);
        }

        const sql = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ALTER COLUMN ${this.buildCreateColumnSql(table.name, newColumn, true, false)}`; // todo: CHANGE OR MODIFY COLUMN ????
        await this.query(sql);

        if (newColumn.isUnique !== oldColumn.isUnique) {
            if (newColumn.isUnique === true) {
                await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} ADD CONSTRAINT "uk_${table.name}_${newColumn.name}" UNIQUE ("${newColumn.name}")`);

            } else if (newColumn.isUnique === false) {
                await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} DROP CONSTRAINT "uk_${table.name}_${newColumn.name}"`);

            }
        }
        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} DROP CONSTRAINT "df_${table.name}_${newColumn.name}"`);
                await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} ADD CONSTRAINT "df_${table.name}_${newColumn.name}" DEFAULT ${newColumn.default} FOR "${newColumn.name}"`);

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                await this.query(`ALTER TABLE ${this.escapeTablePath(tableOrName)} DROP CONSTRAINT "df_${table.name}_${newColumn.name}"`);

            }
        }
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(table: Table, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(table, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: Table, column: TableColumn): Promise<void> {
        if (column.default)
            await this.query(`ALTER TABLE ${this.escapeTablePath(table)} DROP CONSTRAINT "df_${table.name}_${column.name}"`);
        await this.query(`ALTER TABLE ${this.escapeTablePath(table)} DROP COLUMN "${column.name}"`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: Table, columns: TableColumn[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(table, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
        const schema = table.schema || "SCHEMA_NAME()";
        const database = table.database || this.driver.database;
        const oldPrimaryKeySql = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM ${database}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages
LEFT JOIN ${database}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME AND tableConstraints.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE tableConstraints.TABLE_CATALOG = '${database}' AND columnUsages.TABLE_SCHEMA = '${schema}' AND tableConstraints.TABLE_SCHEMA = '${schema}'`;
        const oldPrimaryKey = await this.query(oldPrimaryKeySql);
        if (oldPrimaryKey.length > 0)
            await this.query(`ALTER TABLE ${this.escapeTablePath(table)} DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`);

        const primaryColumnNames = table.primaryKeys.map(primaryKey => `"` + primaryKey.columnName + `"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE ${this.escapeTablePath(table)} ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrPath: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTablePath(foreignKey.referencedTablePath)}(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        return this.query(sql);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrPath: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const sql = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} DROP CONSTRAINT "${foreignKey.name}"`;
        return this.query(sql);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tablePath: Table|string, index: TableIndex): Promise<void> {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTablePath(tablePath)}(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableSchemeOrName: Table|string, indexName: string): Promise<void> {
        const sql = `DROP INDEX "${indexName}" ON ${this.escapeTablePath(tableSchemeOrName)}`;
        await this.query(sql);
    }

    /**
     * Truncates table.
     */
    async truncate(tablePath: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTablePath(tablePath)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(schemas?: string[], database?: string): Promise<void> {
        const isDatabaseExist = await this.hasDatabase(database!);
        if (!isDatabaseExist)
            return Promise.resolve();

        if (!schemas)
            schemas = [];
        schemas.push(this.driver.options.schema || "SCHEMA_NAME()");
        const schemaNamesString = schemas.map(name => {
            return name === "SCHEMA_NAME()" ? name : "'" + name + "'";
        }).join(", ");

        await this.startTransaction();
        try {

            let allTablesSql = `SELECT * FROM ${database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA IN (${schemaNamesString})`;
            const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
            await Promise.all(allTablesResults.map(async tablesResult => {
                const dropForeignKeySql = `SELECT 'ALTER TABLE "${database}"."' + OBJECT_SCHEMA_NAME(fk.parent_object_id, DB_ID('${database}')) + '"."' + OBJECT_NAME(fk.parent_object_id, DB_ID('${database}')) + '" DROP CONSTRAINT "' + fk.name + '"' as query FROM ${database}.sys.foreign_keys AS fk WHERE fk.referenced_object_id = object_id('"${database}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"')`;
                const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
                return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                    return this.query(dropQuery);
                }));
            }));
            await Promise.all(allTablesResults.map(tablesResult => {
                const dropTableSql = `DROP TABLE "${tablesResult["TABLE_CATALOG"]}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`;
                return this.query(dropTableSql);
            }));

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        this.sqlMemoryMode = true;
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        this.sqlsInMemory = [];
        this.sqlMemoryMode = false;
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): (string|{ up: string, down: string })[] {
        return this.sqlsInMemory;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Escapes given table path.
     */
    protected escapeTablePath(tableOrPath: Table|string, disableEscape?: boolean): string {
        let tablePath;
        if (tableOrPath instanceof Table) {
            const schema = tableOrPath.schema || this.driver.options.schema;
            if (schema) {
                tablePath = `${schema}.${tableOrPath.name}`;
                if (tableOrPath.database)
                    tablePath = `${tableOrPath.database}.${tablePath}`;
            } else {
                tablePath = tableOrPath.name;
                if (tableOrPath.database)
                    tablePath = `${tableOrPath.database}..${tablePath}`;
            }
        } else {
            tablePath = tableOrPath.indexOf(".") === -1 && this.driver.options.schema ? this.driver.options.schema + "." + tableOrPath : tableOrPath;
        }

        return tablePath.split(".").map(i => {
            // this condition need because when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected parseTablePath(tablePath: string): any {
        if (tablePath.split(".").length === 3) {
            return {
                database:  "'" + tablePath.split(".")[0] + "'",
                schema:  tablePath.split(".")[1] === "" ? "SCHEMA_NAME()" : "'" + tablePath.split(".")[1] + "'",
                tableName: "'" + tablePath.split(".")[2] + "'"
            };
        } else if (tablePath.split(".").length === 2) {
            return {
                database:  this.driver.options.database,
                schema: "'" + tablePath.split(".")[1] + "'",
                tableName: "'" + tablePath.split(".")[2] + "'"
            };
        } else {
            return {
                database:  this.driver.options.database,
                schema: this.driver.options.schema ? "'" + this.driver.options.schema + "'" : "SCHEMA_NAME()",
                tableName: tablePath
            };
        }
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startFrom: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => {
            return `"${key}"` + "=@" + (startFrom + index);
        });
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(tableName: string, column: TableColumn, skipIdentity: boolean, createDefault: boolean) {
        let c = `"${column.name}" ${this.connection.driver.createFullType(column)}`;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment" && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)";
        // if (column.isPrimary === true && !skipPrimary)
        //     c += " PRIMARY KEY";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (createDefault) {
            if (column.default !== undefined && column.default !== null) {
                c += ` CONSTRAINT "df_${tableName}_${column.name}" DEFAULT ${column.default}`;
            }
        }
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT NEWSEQUENTIALID()";
        return c;
    }


}