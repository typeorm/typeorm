import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Logger} from "../../logger/Logger";
import {DatabaseConnection} from "../DatabaseConnection";
import {TransactionAlreadyStartedError} from "../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../error/TransactionNotStartedError";
import {PostgresDriver} from "./PostgresDriver";
import {DataTypeNotSupportedByDriverError} from "../error/DataTypeNotSupportedByDriverError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {QueryRunnerAlreadyReleasedError} from "../../query-runner/error/QueryRunnerAlreadyReleasedError";
import {ColumnType} from "../../metadata/types/ColumnTypes";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    protected isReleased = false;

    private schemaName: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected databaseConnection: DatabaseConnection,
                protected driver: PostgresDriver,
                protected logger: Logger) {
        this.schemaName = driver.schemaName || "public";
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

        await this.beginTransaction();
        try {
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname = '${this.schemaName}'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));

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

        this.databaseConnection.isTransactionActive = true;
        await this.query("START TRANSACTION");
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

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        return new Promise<any[]>((ok, fail) => {
            this.logger.logQuery(query, parameters);
            this.databaseConnection.connection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.logger.logFailedQuery(query, parameters);
                    this.logger.logQueryError(err);
                    fail(err);
                } else {
                    ok(result.rows);
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
        const sql = columns.length > 0
            ? `INSERT INTO ${this.driver.escapeTableName(tableName)}(${columns}) VALUES (${values}) ${ generatedColumn ? " RETURNING " + this.driver.escapeColumnName(generatedColumn.fullName) : "" }`
            : `INSERT INTO ${this.driver.escapeTableName(tableName)} DEFAULT VALUES ${ generatedColumn ? " RETURNING " + this.driver.escapeColumnName(generatedColumn.fullName) : "" }`;
        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
        if (generatedColumn)
            return result[0][generatedColumn.fullName];

        return result;
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
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}'`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name  FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString}) ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT c.column_name, tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' and tc.table_catalog = '${this.dbName}'`;
        const [dbTables, dbColumns, dbIndices, dbForeignKeys, dbUniqueKeys, primaryKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
            this.query(uniqueKeysSql),
            this.query(primaryKeysSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return dbTables.map(dbTable => {
            const tableSchema = new TableSchema(dbTable["table_name"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["table_name"] === tableSchema.name)
                .map(dbColumn => {
                    const columnType = dbColumn["data_type"].toLowerCase() + (dbColumn["character_maximum_length"] !== undefined && dbColumn["character_maximum_length"] !== null ? ("(" + dbColumn["character_maximum_length"] + ")") : "");
                    const isGenerated = dbColumn["column_default"] === `nextval('${dbColumn["table_name"]}_id_seq'::regclass)` 
                        || dbColumn["column_default"] === `nextval('"${dbColumn["table_name"]}_id_seq"'::regclass)` 
                        || /^uuid\_generate\_v\d\(\)/.test(dbColumn["column_default"]);

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["column_name"];
                    columnSchema.type = columnType;
                    columnSchema.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"] : undefined;
                    columnSchema.isNullable = dbColumn["is_nullable"] === "YES";
                    // columnSchema.isPrimary = dbColumn["column_key"].indexOf("PRI") !== -1;
                    columnSchema.isGenerated = isGenerated;
                    columnSchema.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    columnSchema.isUnique = !!dbUniqueKeys.find(key => key["constraint_name"] ===  `uk_${dbColumn["table_name"]}_${dbColumn["column_name"]}`);
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = primaryKeys
                .filter(primaryKey => primaryKey["table_name"] === tableSchema.name)
                .map(primaryKey => new PrimaryKeySchema(primaryKey["constraint_name"], primaryKey["column_name"]));

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["table_name"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["constraint_name"], [], [], "", "")); // todo: fix missing params

            // create unique key schemas from the loaded indices
            /*tableSchema.uniqueKeys = dbUniqueKeys
                .filter(dbUniqueKey => dbUniqueKey["table_name"] === tableSchema.name)
                .map(dbUniqueKey => {
                    return new UniqueKeySchema(dbUniqueKey["TABLE_NAME"], dbUniqueKey["CONSTRAINT_NAME"], [/!* todo *!/]);
                });*/

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return dbIndex["table_name"] === tableSchema.name &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["index_name"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["index_name"])) &&
                        (!dbUniqueKeys.find(key => key["constraint_name"] === dbIndex["index_name"]));
                })
                .map(dbIndex => dbIndex["index_name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const columnNames = dbIndices
                        .filter(dbIndex => dbIndex["table_name"] === tableSchema.name && dbIndex["index_name"] === dbIndexName)
                        .map(dbIndex => dbIndex["column_name"]);

                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness */);
                });

            return tableSchema;
        });
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let sql = `CREATE SCHEMA IF NOT EXISTS "${this.schemaName}";CREATE TABLE "${table.name}" (${columnDefinitions}`;
        sql += table.columns
            .filter(column => column.isUnique)
            .map(column => `, CONSTRAINT "uk_${table.name}_${column.name}" UNIQUE ("${column.name}")`)
            .join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name = '${tableName}' AND column_name = '${columnName}'`;
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
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column, false)}`;
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

        if (oldColumn.type !== newColumn.type ||
            oldColumn.name !== newColumn.name) {

            let sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
            if (oldColumn.type !== newColumn.type) {
                sql += ` TYPE ${newColumn.type}`;
            }
            if (oldColumn.name !== newColumn.name) { // todo: make rename in a separate query too
                sql += ` RENAME TO ` + newColumn.name;
            }
            await this.query(sql);
        }

        if (oldColumn.isNullable !== newColumn.isNullable) {
            let sql = `ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}"`;
            if (newColumn.isNullable) {
                sql += ` DROP NOT NULL`;
            } else {
                sql += ` SET NOT NULL`;
            }
            await this.query(sql);
        }

        // update sequence generation
        if (oldColumn.isGenerated !== newColumn.isGenerated) {
            if (!oldColumn.isGenerated && newColumn.type !== "uuid") {
                await this.query(`CREATE SEQUENCE "${tableSchema.name}_id_seq" OWNED BY "${tableSchema.name}"."${oldColumn.name}"`);
                await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${tableSchema.name}_id_seq"')`);
            } else {
                await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`);
                await this.query(`DROP SEQUENCE "${tableSchema.name}_id_seq"`);
            }
        }

        if (oldColumn.comment !== newColumn.comment) {
            await this.query(`COMMENT ON COLUMN "${tableSchema.name}"."${oldColumn.name}" is '${newColumn.comment}'`);
        }

        if (oldColumn.isUnique !== newColumn.isUnique) {
            if (newColumn.isUnique === true) {
                await this.query(`ALTER TABLE "${tableSchema.name}" ADD CONSTRAINT "uk_${newColumn.name}" UNIQUE ("${newColumn.name}")`);

            } else if (newColumn.isUnique === false) {
                await this.query(`ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "uk_${newColumn.name}"`);

            }
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
        return this.query(`ALTER TABLE "${tableName}" DROP "${columnName}"`);
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

        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"${primaryKey.columnName}"`);
        await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT IF EXISTS "${dbTable.name}_pkey"`);
        await this.query(`DROP INDEX IF EXISTS "${dbTable.name}_pkey"`);
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
        let sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
            `REFERENCES "${foreignKey.referencedTableName}"("${foreignKey.referencedColumnNames.join("\", \"")}")`;
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

        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${tableName}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (isGenerated) {
            await this.query(`ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`);
        }

        const sql = `DROP INDEX "${indexName}"`; // todo: make sure DROP INDEX should not be used here
        await this.query(sql);
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(typeOptions: { type: ColumnType, length?: string|number, precision?: number, scale?: number, timezone?: boolean }): string {
        switch (typeOptions.type) {
            case "string":
                return "character varying(" + (typeOptions.length ? typeOptions.length : 255) + ")";
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
                if (typeOptions.precision && typeOptions.scale) {
                    return `decimal(${typeOptions.precision},${typeOptions.scale})`;

                } else if (typeOptions.scale) {
                    return `decimal(${typeOptions.scale})`;

                } else if (typeOptions.precision) {
                    return `decimal(${typeOptions.precision})`;

                } else {
                    return "decimal";

                }
            case "date":
                return "date";
            case "time":
                if (typeOptions.timezone) {
                    return "time with time zone";
                } else {
                    return "time without time zone";
                }
            case "datetime":
                if (typeOptions.timezone) {
                    return "timestamp with time zone";
                } else {
                    return "timestamp without time zone";
                }
            case "json":
                return "json";
            case "jsonb":
                return "jsonb";
            case "simple_array":
                return typeOptions.length ? "character varying(" + typeOptions.length + ")" : "text";
            case "uuid":
                return "uuid";
        }

        throw new DataTypeNotSupportedByDriverError(typeOptions.type, "Postgres");
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
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => this.driver.escapeColumnName(key) + "=$" + (startIndex + index + 1));
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipPrimary: boolean) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true && column.type !== "uuid") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " SERIAL";
        if (!column.isGenerated || column.type === "uuid")
            c += " " + column.type;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isGenerated)
            c += " PRIMARY KEY";
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
        if (column.isGenerated && column.type === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";
        return c;
    }

}