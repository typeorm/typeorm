import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {PostgresDriver} from "./PostgresDriver";
import {EntityManager} from "../../entity-manager/EntityManager";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "fs";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner implements QueryRunner {

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
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;

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

    constructor(protected driver: PostgresDriver) {
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
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        this.databaseConnectionPromise = new Promise((ok, fail) => {
            this.driver.pool.connect((err: any, connection: any, release: Function) => {
                if (err) return fail(err);

                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;

                connection.query(`SET search_path TO '${this.schemaName}', 'public';`, (err: any) => {
                    if (err) {
                        this.driver.connection.logger.logFailedQuery(`SET search_path TO '${this.schemaName}', 'public';`, [], this);
                        this.driver.connection.logger.logQueryError(err, this);
                        fail(err);
                    } else {
                        ok(connection);
                    }
                });

            });
        });

        return this.databaseConnectionPromise;
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        if (this.releaseCallback)
            this.releaseCallback();

        const index = this.driver.connectedQueryRunners.indexOf(this);
        if (index !== -1) this.driver.connectedQueryRunners.splice(index);

        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("START TRANSACTION");
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.isTransactionActive = false;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        // console.log("query: ", query);
        // console.log("parameters: ", parameters);
        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            databaseConnection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.driver.connection.logger.logFailedQuery(query, parameters, this);
                    this.driver.connection.logger.logQueryError(err, this);
                    fail(err);
                } else {
                    ok(result.rows);
                }
            });
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        const QueryStream = this.driver.loadStreamDependency();
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const stream = databaseConnection.query(new QueryStream(query, parameters));
            if (onEnd) stream.on("end", onEnd);
            if (onError) stream.on("error", onError);
            ok(stream);
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const sql = columns.length > 0
            ? `INSERT INTO "${tableName}"(${columns}) VALUES (${values}) ${ generatedColumn ? ` RETURNING "${generatedColumn.databaseName}"` : "" }`
            : `INSERT INTO "${tableName}" DEFAULT VALUES ${ generatedColumn ? ` RETURNING "${generatedColumn.databaseName}"` : "" }`;
        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
        if (generatedColumn)
            return result[0][generatedColumn.databaseName];

        return result;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE "${tableName}" SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
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
     * Inserts rows into closure table.
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
        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}'`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name  FROM pg_class t, pg_class i, pg_index ix, pg_attribute a, pg_namespace ns
WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString}) AND t.relnamespace = ns.OID AND ns.nspname ='${this.schemaName}' ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT c.column_name, tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' AND c.table_schema = '${this.schemaName}' and tc.table_catalog = '${this.dbName}'`;
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
                    columnSchema.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"].replace(/::character varying/, "") : undefined;
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
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        await this.query(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
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
        const sql = `SELECT * FROM information_schema.columns WHERE table_catalog = '${this.dbName}' AND table_schema = '${this.schemaName}' AND table_name = '${tableName}' AND column_name = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column, false)}`;
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

        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                await this.query(`ALTER TABLE "${tableSchema.name}" ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);

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
        return this.query(`ALTER TABLE "${table.name}" DROP "${column.name}"`);
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
        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => `"${primaryKey.columnName}"`);
        await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT IF EXISTS "${dbTable.name}_pkey"`);
        await this.query(`DROP INDEX IF EXISTS "${dbTable.name}_pkey"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
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
        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${tableName}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string, isGenerated: boolean = false): Promise<void> {
        if (isGenerated) {
            await this.query(`ALTER SEQUENCE "${tableName}_id_seq" OWNED BY NONE`);
        }

        const sql = `DROP INDEX "${indexName}"`; // todo: make sure DROP INDEX should not be used here
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
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname = '${this.schemaName}'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));

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
        return this.driver.options.database!;
    }

    /**
     * Schema name shortcut.
     */
    protected get schemaName() {
        return this.driver.options.schemaName || "public";
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => "\"" + key + "\"=$" + (startIndex + index + 1));
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
            c += " DEFAULT " + column.default;
        }
        if (column.isGenerated && column.type === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";
        return c;
    }

}