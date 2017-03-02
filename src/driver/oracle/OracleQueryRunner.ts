import {QueryRunner} from "../../query-runner/QueryRunner";
import {DatabaseConnection} from "../DatabaseConnection";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {Logger} from "../../logger/Logger";
import {OracleDriver} from "./OracleDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {QueryRunnerAlreadyReleasedError} from "../../query-runner/error/QueryRunnerAlreadyReleasedError";
import {ColumnType} from "../../metadata/types/ColumnTypes";

/**
 * Runs queries on a single mysql database connection.
 *
 * todo: this driver is not 100% finished yet, need to fix all issues that are left
 */
export class OracleQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    protected isReleased = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected databaseConnection: DatabaseConnection,
                protected driver: OracleDriver,
                protected logger: Logger) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     * You cannot use this class's methods after its released.
     */
    release(): Promise<void> {
        if (this.databaseConnection.releaseCallback) {
            this.isReleased = true;
            return this.databaseConnection.releaseCallback();
        }

        return Promise.resolve();
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        await this.beginTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS ', table_name, ';') AS query FROM information_schema.tables WHERE table_schema = '${this.dbName}'`;
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

            await this.query(disableForeignKeysCheckQuery);
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
            await this.query(enableForeignKeysCheckQuery);

            await this.commitTransaction();

        } catch (error) {
            await this.rollbackTransaction();
            throw error;

        } finally {
            await this.release();
        }

    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        // await this.query("START TRANSACTION");
        this.databaseConnection.isTransactionActive = true;
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.databaseConnection.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.databaseConnection.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.databaseConnection.isTransactionActive = false;
    }

    /**
     * Checks if transaction is in progress.
     */
    isTransactionActive(): boolean {
        return this.databaseConnection.isTransactionActive;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise((ok, fail) => {
            this.logger.logQuery(query, parameters);
            const handler = (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query, parameters);
                    this.logger.logQueryError(err);
                    return fail(err);
                }

                ok(result.rows || result.outBinds);
            };
            const executionOptions = {
                autoCommit: this.databaseConnection.isTransactionActive ? false : true
            };
            this.databaseConnection.connection.execute(query, parameters || {}, executionOptions, handler);
        });
    }

    /**
     * Insert a new row with given values into given table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.driver.escapeColumnName(key)).join(", ");
        const values = keys.map(key => ":" + key).join(", ");
        const parameters = keys.map(key => keyValues[key]);

        const insertSql = columns.length > 0
            ? `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values})`
            : `INSERT INTO ${this.driver.escapeTableName(tableName)} DEFAULT VALUES`;
        if (generatedColumn) {
            const sql2 = `declare lastId number; begin ${insertSql} returning "id" into lastId; dbms_output.enable; dbms_output.put_line(lastId); dbms_output.get_line(:ln, :st); end;`;
            const saveResult = await this.query(sql2, parameters.concat([
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.STRING, maxSize: 32767 },
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.NUMBER }
            ]));
            return parseInt(saveResult[0]);
        } else {
            return this.query(insertSql, parameters);
        }
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE ${this.driver.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, condition: string, parameters?: any[]): Promise<void>;

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void>;

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM ${this.driver.escapeTableName(tableName)} WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let sql = "";
        if (hasLevel) {
            sql =   `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                    `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql =   `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant) ` +
                    `SELECT ancestor, ${newEntityId} FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId}`);
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
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME IN (${tableNamesString})`;
        const columnsSql     = `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE, IDENTITY_COLUMN FROM all_tab_cols WHERE TABLE_NAME IN (${tableNamesString})`;
        const indicesSql     = `SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '${this.dbName}' AND INDEX_NAME != 'PRIMARY'`;
        const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${this.dbName}' AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        const uniqueKeysSql  = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '${this.dbName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        const constraintsSql = `SELECT cols.table_name, cols.column_name, cols.position, cons.constraint_type, cons.constraint_name
FROM all_constraints cons, all_cons_columns cols WHERE cols.table_name IN (${tableNamesString}) 
AND cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner ORDER BY cols.table_name, cols.position`;
        const [dbTables, dbColumns, /*dbIndices, dbForeignKeys, dbUniqueKeys, */constraints]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            // this.query(indicesSql),
            // this.query(foreignKeysSql),
            // this.query(uniqueKeysSql),
            this.query(constraintsSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return dbTables.map(dbTable => {
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {
                    const isPrimary = !!constraints
                        .find(constraint => {
                            return  constraint["TABLE_NAME"] === tableSchema.name &&
                                    constraint["CONSTRAINT_TYPE"] === "P" &&
                                    constraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                        });

                    let columnType = dbColumn["DATA_TYPE"].toLowerCase();
                    if (dbColumn["DATA_TYPE"].toLowerCase() === "varchar2" && dbColumn["DATA_LENGTH"] !== null) {
                        columnType += "(" + dbColumn["DATA_LENGTH"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null && dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + "," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(0," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + ")";
                    }

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = columnType;
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["NULLABLE"] !== "N";
                    columnSchema.isPrimary = isPrimary;
                    columnSchema.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES"; // todo
                    columnSchema.comment = ""; // todo
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "P")
                .map(constraint => new PrimaryKeySchema(constraint["CONSTRAINT_NAME"], constraint["COLUMN_NAME"]));

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "R")
                .map(constraint => new ForeignKeySchema(constraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // console.log(tableSchema);

            // create index schemas from the loaded indices
            // tableSchema.indices = dbIndices
            //     .filter(dbIndex => {
            //         return  dbIndex["table_name"] === tableSchema.name &&
            //             (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
            //             (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
            //     })
            //     .map(dbIndex => dbIndex["INDEX_NAME"])
            //     .filter((value, index, self) => self.indexOf(value) === index) // unqiue
            //     .map(dbIndexName => {
            //         const columnNames = dbIndices
            //             .filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName)
            //             .map(dbIndex => dbIndex["COLUMN_NAME"]);
            //
            //         return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness */);
            //     });

            return tableSchema;
        });
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `SELECT COLUMN_NAME FROM all_tab_cols WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableName: string, column: ColumnSchema): Promise<void>;

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchema: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column)}`;
        return this.query(sql);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableName: string, columns: ColumnSchema[]): Promise<void>;

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const queries = columns.map(column => this.addColumn(tableSchemaOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    renameColumn(table: TableSchema, oldColumn: ColumnSchema, newColumn: ColumnSchema): Promise<void>;

    /**
     * Renames column in the given table.
     */
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string): Promise<void>;

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
    changeColumn(tableSchema: TableSchema, oldColumn: ColumnSchema, newColumn: ColumnSchema): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(tableSchema: string, oldColumn: string, newColumn: ColumnSchema): Promise<void>;

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumn: ColumnSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

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

        if (newColumn.isGenerated !== oldColumn.isGenerated) {

            if (newColumn.isGenerated) {
                if (tableSchema.primaryKeys.length > 0 && oldColumn.isPrimary) {
                    // console.log(tableSchema.primaryKeys);
                    const dropPrimarySql = `ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "${tableSchema.primaryKeys[0].name}"`;
                    await this.query(dropPrimarySql);
                }

                // since modifying identity column is not supported yet, we need to recreate this column
                const dropSql = `ALTER TABLE "${tableSchema.name}" DROP COLUMN "${newColumn.name}"`;
                await this.query(dropSql);

                const createSql = `ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(newColumn)}`;
                await this.query(createSql);

            } else {
                const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" DROP IDENTITY`;
                await this.query(sql);

            }
        }

        if (newColumn.isNullable !== oldColumn.isNullable) {
            const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" ${newColumn.type} ${newColumn.isNullable ? "NULL" : "NOT NULL"}`;
            await this.query(sql);

        } else if (newColumn.type !== oldColumn.type) { // elseif is used because
            const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" ${newColumn.type}`;
            await this.query(sql);
        }
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableSchema, changedColumn.oldColumn, changedColumn.newColumn);
        });
        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableName: string, columnName: string): Promise<void>;

    /**
     * Drops column in the table.
     */
    async dropColumn(tableSchema: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Drops column in the table.
     */
    async dropColumn(tableSchemaOrName: TableSchema|string, columnSchemaOrName: ColumnSchema|string): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const columnName = columnSchemaOrName instanceof ColumnSchema ? columnSchemaOrName.name : columnSchemaOrName;
        return this.query(`ALTER TABLE "${tableName}" DROP COLUMN "${columnName}"`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableName: string, columnNames: string[]): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableSchemaOrName: TableSchema|string, columnSchemasOrNames: ColumnSchema[]|string[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const dropPromises = (columnSchemasOrNames as any[]).map(column => this.dropColumn(tableSchemaOrName as any, column as any));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => "\"" + primaryKey.columnName + "\"");
        // console.log(dbTable.primaryKeys);
        if (dbTable.primaryKeys.length > 0 && dbTable.primaryKeys[0].name)
            await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${dbTable.primaryKeys[0].name}"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableName: string, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchema: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const columnNames = foreignKey.columnNames.map(column => "\"" + column + "\"").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "\"" + column + "\"").join(",");
        let sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        return this.query(sql);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableName: string, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableName: string, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchema: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKey.name}"`;
        return this.query(sql);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableName: string, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableName: string, index: IndexSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columns = index.columnNames.map(columnName => "\"" + columnName + "\"").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const sql = `ALTER TABLE "${tableName}" DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(typeOptions: { type: ColumnType, length?: string|number, precision?: number, scale?: number, timezone?: boolean }) {
        switch (typeOptions.type) {
            case "string":
                return "varchar2(" + (typeOptions.length ? typeOptions.length : 255) + ")";
            case "text":
                return "clob";
            case "boolean":
                return "number(1)";
            case "integer":
            case "int":
                // if (column.isGenerated)
                //     return `number(22)`;
                if (typeOptions.precision && typeOptions.scale)
                    return `number(${typeOptions.precision},${typeOptions.scale})`;
                if (typeOptions.precision)
                    return `number(${typeOptions.precision},0)`;
                if (typeOptions.scale)
                    return `number(0,${typeOptions.scale})`;

                return "number(10,0)";
            case "smallint":
                return "number(5)";
            case "bigint":
                return "number(20)";
            case "float":
                if (typeOptions.precision && typeOptions.scale)
                    return `float(${typeOptions.precision},${typeOptions.scale})`;
                if (typeOptions.precision)
                    return `float(${typeOptions.precision},0)`;
                if (typeOptions.scale)
                    return `float(0,${typeOptions.scale})`;

                return `float(126)`;
            case "double":
            case "number":
                return "float(126)";
            case "decimal":
                if (typeOptions.precision && typeOptions.scale) {
                    return `decimal(${typeOptions.precision},${typeOptions.scale})`;

                } else if (typeOptions.scale) {
                    return `decimal(0,${typeOptions.scale})`;

                } else if (typeOptions.precision) {
                    return `decimal(${typeOptions.precision})`;

                } else {
                    return "decimal";
                }
            case "date":
                return "date";
            case "time":
                return "date";
            case "datetime":
                return "timestamp(0)";
            case "json":
                return "clob";
            case "simple_array":
                return typeOptions.length ? "varchar2(" + typeOptions.length + ")" : "text";
        }

        throw new DataTypeNotSupportedByDriverError(typeOptions.type, "Oracle");
    }

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database schema are equal.
     */
    compareDefaultValues(columnMetadataValue: any, databaseValue: any): boolean {

        if (typeof columnMetadataValue === "number")
            return columnMetadataValue === parseInt(databaseValue);
        if (typeof columnMetadataValue === "boolean")
            return columnMetadataValue === (!!databaseValue || databaseValue === "false");
        if (typeof columnMetadataValue === "function")
            return columnMetadataValue() === databaseValue;

        return columnMetadataValue === databaseValue;
    }

    /**
     * Truncates table.
     */
    async truncate(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.driver.escapeTableName(tableName)}`);
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
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => this.driver.escapeColumnName(key) + "=:" + key);
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema) {
        let c = `"${column.name}" ` + column.type;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        // if (column.isPrimary === true && addPrimary)
        //     c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " GENERATED BY DEFAULT ON NULL AS IDENTITY";
        // if (column.comment) // todo: less priority, fix it later
        //     c += " COMMENT '" + column.comment + "'";
        if (column.default !== undefined && column.default !== null) { // todo: same code in all drivers. make it DRY
            if (typeof column.default === "number") {
                c += " DEFAULT " + column.default + "";
            } else if (typeof column.default === "boolean") {
                c += " DEFAULT " + (column.default === true ? "TRUE" : "FALSE") + "";
            } else if (typeof column.default === "function") {
                c += " DEFAULT " + column.default() + "";
            } else if (typeof column.default === "string") {
                c += " DEFAULT '" + column.default + "'";
            } else {
                c += " DEFAULT " + column.default + "";
            }
        }

        return c;
    }


}