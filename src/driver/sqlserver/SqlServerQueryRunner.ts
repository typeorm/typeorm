import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {SqlServerDriver} from "./SqlServerDriver";
import {EntityManager} from "../../entity-manager/EntityManager";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "fs";

/**
 * Runs queries on a single mysql database connection.
 */
export class SqlServerQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Entity manager isolated for this query runner.
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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected driver: SqlServerDriver) {
        this.connection = driver.connection;
        this.manager = driver.connection.manager;
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
            this.databaseConnection = this.driver.connectionPool.transaction();
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

            this.driver.connection.logger.logQuery(query, parameters, this);
            const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : this.driver.connectionPool);
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    request.input(index, parameters![index]);
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
                    this.driver.connection.logger.logFailedQuery(query, parameters, this);
                    this.driver.connection.logger.logQueryError((err.originalError && err.originalError.info) ? err.originalError.info.message : err, this);
                    resolveChain();
                    return fail(err);
                }

                ok(result.recordset);
                resolveChain();
            });
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
            const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : this.driver.connectionPool);
            request.stream = true;
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    request.input(index, parameters![index]);
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
                    this.driver.connection.logger.logFailedQuery(query, parameters, this);
                    this.driver.connection.logger.logQueryError((err.originalError && err.originalError.info) ? err.originalError.info.message : err, this);
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
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key, index) => "@" + index).join(",");
        const parameters = keys.map(key => keyValues[key]);

        const sql = columns.length > 0
            ? `INSERT INTO "${tableName}"(${columns}) ${ generatedColumn ? "OUTPUT INSERTED." + generatedColumn.databaseName + " " : "" }VALUES (${values})`
            : `INSERT INTO "${tableName}" ${ generatedColumn ? "OUTPUT INSERTED." + generatedColumn.databaseName + " " : "" }DEFAULT VALUES `;

        const result = await this.query(sql, parameters);
        return generatedColumn ? result instanceof Array ? result[0][generatedColumn.databaseName] : result[generatedColumn.databaseName] : undefined;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, updateParams.length).join(" AND ");
        const sql = `UPDATE "${tableName}" SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;

        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant") ` +
                `SELECT "ancestor", ${newEntityId} FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM "${tableName}" WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Loads given table's data from the database.
     */
    async loadTableSchema(tableName: string): Promise<TableSchema|undefined> {
        const tableSchemas = await this.loadTableSchemas([tableName]);
        return tableSchemas.length > 0 ? tableSchemas[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async loadTableSchemas(tableNames: string[]): Promise<TableSchema[]> {

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");
        const tablesSql          = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.dbName}' AND TABLE_NAME IN (${tableNamesString})`;
        const columnsSql         = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.dbName}'`;
        const constraintsSql     = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages ` +
`LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME ` +
`WHERE columnUsages.TABLE_CATALOG = '${this.dbName}' AND tableConstraints.TABLE_CATALOG = '${this.dbName}'`;
        const identityColumnsSql = `SELECT COLUMN_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_CATALOG = '${this.dbName}' AND COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1;`;
        const indicesSql         = `SELECT TABLE_NAME = t.name, INDEX_NAME = ind.name, IndexId = ind.index_id, ColumnId = ic.index_column_id, COLUMN_NAME = col.name, ind.*, ic.*, col.* ` +
`FROM sys.indexes ind INNER JOIN sys.index_columns ic ON ind.object_id = ic.object_id and ind.index_id = ic.index_id INNER JOIN sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id ` +
`INNER JOIN sys.tables t ON ind.object_id = t.object_id WHERE ind.is_primary_key = 0 AND ind.is_unique = 0 AND ind.is_unique_constraint = 0 AND t.is_ms_shipped = 0 ORDER BY t.name, ind.name, ind.index_id, ic.index_column_id`;
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
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {
                    const isPrimary = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                    });
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return  column["TABLE_NAME"] === tableSchema.name &&
                                column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });
                    const isUnique = !!dbConstraints.find(dbConstraint => {
                        return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                                dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] &&
                                dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
                    });

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = dbColumn["DATA_TYPE"].toLowerCase() + (dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? "(" + dbColumn["CHARACTER_MAXIMUM_LENGTH"] + ")" : ""); // todo: use normalize type?
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    columnSchema.isPrimary = isPrimary;
                    columnSchema.isGenerated = isGenerated;
                    columnSchema.isUnique = isUnique;
                    columnSchema.comment = ""; // todo: less priority, implement this later
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "PRIMARY KEY";
                })
                .map(keyColumnUsage => {
                    return new PrimaryKeySchema(keyColumnUsage["CONSTRAINT_NAME"], keyColumnUsage["COLUMN_NAME"]);
                });

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbConstraints
                .filter(dbConstraint => {
                    return  dbConstraint["TABLE_NAME"] === tableSchema.name &&
                            dbConstraint["CONSTRAINT_TYPE"] === "FOREIGN KEY";
                })
                .map(dbConstraint => new ForeignKeySchema(dbConstraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["TABLE_NAME"] === tableSchema.name &&
                            (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                            (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
                        .map(dbIndex => dbIndex["COLUMN_NAME"]);

                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness? */);
                });

            return tableSchema;
        }));
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table.name, column, false, true)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        sql += table.columns
            .filter(column => column.isUnique)
            .map(column => `, CONSTRAINT "uk_${table.name}_${column.name}" UNIQUE ("${column.name}")`)
            .join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: string): Promise<void> {
        let sql = `DROP TABLE "${tableName}"`;
        await this.query(sql);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_CATALOG = '${this.dbName}' AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(tableName, column, false, true)}`;
        return this.query(sql);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableSchemaOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumnSchemaOrName: ColumnSchema|string): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.loadTableSchema(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        let newColumn: ColumnSchema|undefined = undefined;
        if (newColumnSchemaOrName instanceof ColumnSchema) {
            newColumn = newColumnSchemaOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newColumnSchemaOrName;
        }

        return this.changeColumn(tableSchema, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumn: ColumnSchema): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.loadTableSchema(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        // to update an identy column we have to drop column and recreate it again
        if (newColumn.isGenerated !== oldColumn.isGenerated) {
            await this.query(`ALTER TABLE "${tableSchema.name}" DROP COLUMN "${newColumn.name}"`);
            await this.query(`ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(tableSchema.name, newColumn, false, false)}`);
        }

        const sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN ${this.buildCreateColumnSql(tableSchema.name, newColumn, true, false)}`; // todo: CHANGE OR MODIFY COLUMN ????
        await this.query(sql);

        if (newColumn.isUnique !== oldColumn.isUnique) {
            if (newColumn.isUnique === true) {
                await this.query(`ALTER TABLE "${tableSchema.name}" ADD CONSTRAINT "uk_${tableSchema.name}_${newColumn.name}" UNIQUE ("${newColumn.name}")`);

            } else if (newColumn.isUnique === false) {
                await this.query(`ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "uk_${tableSchema.name}_${newColumn.name}"`);

            }
        }
        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                await this.query(`ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "df_${tableSchema.name}_${newColumn.name}"`);
                await this.query(`ALTER TABLE "${tableSchema.name}" ADD CONSTRAINT "df_${tableSchema.name}_${newColumn.name}" DEFAULT ${newColumn.default} FOR "${newColumn.name}"`);

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                await this.query(`ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "df_${tableSchema.name}_${newColumn.name}"`);

            }
        }
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableSchema, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {

        // drop depend constraints
        if (column.default)
            await this.query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "df_${table.name}_${column.name}"`);

        // drop column itself
        await this.query(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(table, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        const oldPrimaryKeySql = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE columnUsages
LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME AND tableConstraints.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE columnUsages.TABLE_CATALOG = '${this.dbName}' AND tableConstraints.TABLE_CATALOG = '${this.dbName}'`;
        const oldPrimaryKey = await this.query(oldPrimaryKeySql);
        if (oldPrimaryKey.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`);

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"` + primaryKey.columnName + `"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);

    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        return this.query(sql);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKey.name}"`;
        return this.query(sql);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableName: string, index: IndexSchema): Promise<void> {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
        const sql = `DROP INDEX "${tableName}"."${indexName}"`;
        await this.query(sql);
    }

    /**
     * Truncates table.
     */
    async truncate(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE "${tableName}"`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            const allTablesSql = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
            const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
            const tableNames = allTablesResults.map(result => result["TABLE_NAME"]);
            await Promise.all(tableNames.map(async tableName => {
                const dropForeignKeySql = `SELECT 'ALTER TABLE ' +  OBJECT_SCHEMA_NAME(parent_object_id) + '.[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT ' + name as query FROM sys.foreign_keys WHERE referenced_object_id = object_id('${tableName}')`;
                const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
                return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                    return this.query(dropQuery);
                }));
            }));
            await Promise.all(tableNames.map(tableName => {
                const dropTableSql = `DROP TABLE "${tableName}"`;
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
     * Database name shortcut.
     */
    protected get dbName(): string {
        return this.driver.options.database as string;
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
    protected buildCreateColumnSql(tableName: string, column: ColumnSchema, skipIdentity: boolean, createDefault: boolean) {
        let c = `"${column.name}" ${column.type}`;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated === true && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
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
        return c;
    }


}