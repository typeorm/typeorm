import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Logger} from "../../logger/Logger";
import {DatabaseConnection} from "../DatabaseConnection";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {SqliteDriver} from "./SqliteDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {QueryRunnerAlreadyReleasedError} from "../../query-runner/error/QueryRunnerAlreadyReleasedError";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class SqliteQueryRunner implements QueryRunner {

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
                protected driver: SqliteDriver,
                protected logger: Logger) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
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

        const selectDropsQuery = `select 'drop table ' || name || ';' as query from sqlite_master where type = 'table' and name != 'sqlite_sequence'`;
        const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
        await Promise.all(dropQueries.map(q => this.query(q["query"])));
    }

    /**
     * Starts transaction.
     */
    async beginTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        if (this.databaseConnection.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.databaseConnection.isTransactionActive = true;
        await this.query("BEGIN TRANSACTION");
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

        this.logger.logQuery(query, parameters);
        return new Promise<any[]>((ok, fail) => {
            this.databaseConnection.connection.all(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query, parameters);
                    this.logger.logQueryError(err);
                    fail(err);
                } else {
                    ok(result);
                }
            });
        });
    }

    /**
     * Insert a new row into given table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const keys = Object.keys(keyValues);
        const columns = keys.map(key => this.driver.escapeColumnName(key)).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const sql = columns.length > 0 ? (`INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values})`) : `INSERT INTO ${this.driver.escapeTableName(tableName)} DEFAULT VALUES`;
        const parameters = keys.map(key => keyValues[key]);

        this.logger.logQuery(sql, parameters);
        return new Promise<any[]>((ok, fail) => {
            const _this = this;
            this.databaseConnection.connection.run(sql, parameters, function (err: any): void {
                if (err) {
                    _this.logger.logFailedQuery(sql, parameters);
                    _this.logger.logQueryError(err);
                    fail(err);
                } else {
                    if (generatedColumn)
                        return ok(this["lastID"]);

                    ok();
                }
            });
        });
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE ${this.driver.escapeTableName(tableName)} SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const conditionString = this.parametrize(conditions).join(" AND ");
        const parameters = Object.keys(conditions).map(key => conditions[key]);
        const query = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(query, parameters);
    }

    /**
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant, level) ` +
                `SELECT ancestor, ${newEntityId}, level + 1 FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO ${this.driver.escapeTableName(tableName)}(ancestor, descendant) ` +
                `SELECT ancestor, ${newEntityId} FROM ${this.driver.escapeTableName(tableName)} WHERE descendant = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async loadSchemaTables(tableNames: string[], namingStrategy: NamingStrategyInterface): Promise<TableSchema[]> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // if no tables given then no need to proceed

        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const dbTables: ObjectLiteral[] = await this.query(`SELECT * FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence'`);

        // if tables were not found in the db, no need to proceed
        if (!dbTables || !dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const tableSchema = new TableSchema(dbTable["name"]);

            // load columns and indices
            const [dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
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
            tableSchema.indices = indices.filter(index => !!index) as IndexSchema[];

            return tableSchema;
        }));
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // skip columns with foreign keys, we will add them later
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `${column.name}`).join(", ")})`; // for some reason column escaping here generates a wrong schema
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Creates a new column from the column metadata in the table.
     */
    async createColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void> { // todo: remove column metadata returning
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        await this.recreateTable(tableSchema);
    }

    /**
     * Changes a column in the table.
     * Changed column looses all its keys in the db.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return this.recreateTable(tableSchema);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableSchema: TableSchema, columns: ColumnSchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const newTable = tableSchema.clone();
        newTable.removeColumns(columns);
        return this.recreateTable(newTable);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return this.recreateTable(dbTable);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const newTable = tableSchema.clone();
        newTable.addForeignKeys(foreignKeys);
        return this.recreateTable(newTable);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchema: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const newTable = tableSchema.clone();
        newTable.removeForeignKeys(foreignKeys);
        return this.recreateTable(newTable);
    }

    /**
     * Creates a new index.
     */
    async createIndex(index: IndexSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${index.tableName}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const sql = `DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: ColumnMetadata) {
        switch (column.normalizedDataType) {
            case "string":
                return "character varying(" + (column.length ? column.length : 255) + ")";
            case "text":
                return "text";
            case "boolean":
                return "boolean";
            case "integer":
            case "int":
                return "integer";
            case "smallint":
                return "smallint";
            case "bigint":
                return "bigint";
            case "float":
                return "real";
            case "double":
            case "number":
                return "double precision";
            case "decimal":
                if (column.precision && column.scale) {
                    return `decimal(${column.precision},${column.scale})`;

                } else if (column.scale) {
                    return `decimal(${column.scale})`;

                } else if (column.precision) {
                    return `decimal(${column.precision})`;

                } else {
                    return "decimal";

                }
            case "date":
                return "date";
            case "time":
                if (column.timezone) {
                    return "time with time zone";
                } else {
                    return "time without time zone";
                }
            case "datetime":
                if (column.timezone) {
                    return "timestamp with time zone";
                } else {
                    return "timestamp without time zone";
                }
            case "json":
                return "json";
            case "simple_array":
                return column.length ? "character varying(" + column.length + ")" : "text";
        }

        throw new DataTypeNotSupportedByDriverError(column.type, "SQLite");
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.driver.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema): string {
        let c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata) {
            c += " " + this.normalizeType(column);
        } else {
            c += " " + column.type;
        }
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isUnique === true)
            c += " UNIQUE";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " PRIMARY KEY AUTOINCREMENT";

        return c;
    }

    protected async recreateTable(tableSchema: TableSchema): Promise<void> {
        // const withoutForeignKeyColumns = columns.filter(column => column.foreignKeys.length === 0);
        // const createForeignKeys = options && options.createForeignKeys;
        const columnDefinitions = tableSchema.columns.map(dbColumn => this.buildCreateColumnSql(dbColumn)).join(", ");
        const columnNames = tableSchema.columns.map(column => `"${column.name}"`).join(", ");

        let sql1 = `CREATE TABLE "temporary_${tableSchema.name}" (${columnDefinitions}`;
        // if (options && options.createForeignKeys) {
        tableSchema.foreignKeys.forEach(foreignKey => {
            const columnNames = foreignKey.columnNames.map(name => `"${name}"`).join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(name => `"${name}"`).join(", ");
            sql1 += `, FOREIGN KEY(${columnNames}) REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
        });

        const primaryKeyColumns = tableSchema.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql1 += `, PRIMARY KEY(${primaryKeyColumns.map(column => `${column.name}`).join(", ")})`; // for some reason column escaping here generate a wrong schema

        sql1 += ")";

        // todo: need also create uniques and indices?

        // recreate a table with a temporary name
        await this.query(sql1);

        // migrate all data from the table into temporary table
        const sql2 = `INSERT INTO "temporary_${tableSchema.name}" SELECT ${columnNames} FROM "${tableSchema.name}"`;
        await this.query(sql2);

        // drop old table
        const sql3 = `DROP TABLE "${tableSchema.name}"`;
        await this.query(sql3);

        // rename temporary table
        const sql4 = `ALTER TABLE "temporary_${tableSchema.name}" RENAME TO "${tableSchema.name}"`;
        await this.query(sql4);

        // also re-create indices
        const indexPromises = tableSchema.indices.map(index => this.createIndex(index));
        // const uniquePromises = tableSchema.uniqueKeys.map(key => this.createIndex(key));
        await Promise.all(indexPromises/*.concat(uniquePromises)*/);
    }

}
