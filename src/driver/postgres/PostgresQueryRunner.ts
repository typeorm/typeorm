import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/schema/TableColumn";
import {Table} from "../../schema-builder/schema/Table";
import {TableIndex} from "../../schema-builder/schema/TableIndex";
import {TableForeignKey} from "../../schema-builder/schema/TableForeignKey";
import {TablePrimaryKey} from "../../schema-builder/schema/TablePrimaryKey";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {PostgresDriver} from "./PostgresDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {InsertResult} from "../InsertResult";
import {QueryFailedError} from "../../error/QueryFailedError";
import {OrmUtils} from "../../util/OrmUtils";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: PostgresDriver;

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

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
    protected sqlsInMemory: (string|{ up: string, down: string })[] = [];

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: PostgresDriver, mode: "master"|"slave" = "master") {
        this.driver = driver;
        this.connection = driver.connection;
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
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated)  {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([ connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }

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
            const queryStartTime = +new Date();

            databaseConnection.query(query, parameters, (err: any, result: any) => {

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (err) {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
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
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(new QueryStream(query, parameters));
                if (onEnd) stream.on("end", onEnd);
                if (onError) stream.on("error", onError);
                ok(stream);

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tablePath: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map((key, index) => "$" + (index + 1)).join(",");
        const generatedColumns = this.connection.hasMetadata(tablePath) ? this.connection.getMetadata(tablePath).generatedColumns : [];
        const generatedColumnNames = generatedColumns.map(generatedColumn => `"${generatedColumn.databaseName}"`).join(", ");
        const generatedColumnSql = generatedColumns.length > 0 ? ` RETURNING ${generatedColumnNames}` : "";

        const sql = columns.length > 0
            ? `INSERT INTO ${this.escapeTablePath(tablePath)}(${columns}) VALUES (${values}) ${generatedColumnSql}`
            : `INSERT INTO ${this.escapeTablePath(tablePath)} DEFAULT VALUES ${generatedColumnSql}`;

        const parameters = keys.map(key => keyValues[key]);
        const result: ObjectLiteral[] = await this.query(sql, parameters);
        const generatedMap = generatedColumns.reduce((map, column) => {
            const valueMap = column.createValueMap(result[0][column.databaseName]);
            return OrmUtils.mergeDeep(map, valueMap);
        }, {} as ObjectLiteral);

        return {
            result: result,
            generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
        };
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tablePath: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE ${this.escapeTablePath(tablePath)} SET ${updateValues}${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tablePath: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM ${this.escapeTablePath(tablePath)} WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into closure table.
     *
     * todo: rethink its place
     */
    async insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
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
            return tablePath.indexOf(".") === -1 ? tablePath : tablePath.split(".")[1];
        });

        const currentSchemaQuery = await this.query(`SELECT * FROM current_schema()`);
        const currentSchema = currentSchemaQuery[0]["current_schema"];
        const schemaNames = tablePaths
            .filter(tablePath => tablePath.indexOf(".") !== -1)
            .map(tablePath => tablePath.split(".")[0]);
        schemaNames.push(this.driver.options.schema || currentSchema);

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => `'${name}'`).join(", ");
        const schemaNamesString = schemaNames.map(name => `'${name}'`).join(", ");
        const tablesSql      = `SELECT * FROM information_schema.tables WHERE table_schema IN (${schemaNamesString}) AND table_name IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM information_schema.columns WHERE table_schema IN (${schemaNamesString})`;
        const indicesSql     = `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name, ix.indisunique AS is_unique, a.attnum, ix.indkey FROM pg_class t, pg_class i, pg_index ix, pg_attribute a, pg_namespace ns
WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid
AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname IN (${tableNamesString}) AND t.relnamespace = ns.OID AND ns.nspname IN (${schemaNamesString}) ORDER BY t.relname, i.relname`;
        const foreignKeysSql = `SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE table_schema IN (${schemaNamesString}) AND constraint_type = 'FOREIGN KEY'`;
        const uniqueKeysSql  = `SELECT * FROM information_schema.table_constraints WHERE table_schema IN (${schemaNamesString}) AND constraint_type = 'UNIQUE'`;
        const primaryKeysSql = `SELECT c.column_name, tc.table_name, tc.constraint_name FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
where constraint_type = 'PRIMARY KEY' AND c.table_schema IN (${schemaNamesString})`;
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

        // create tables for loaded tables
        return dbTables.map(dbTable => {
            const table = new Table(dbTable["table_name"]);

            table.database = dbTable["table_catalog"];
            table.schema = dbTable["table_schema"];

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => dbColumn["table_name"] === table.name)
                .map(dbColumn => {
                    const seqName = table.schema === currentSchema
                        ? `${dbColumn["table_name"]}_${dbColumn["column_name"]}_seq`
                        : `${table.schema}.${dbColumn["table_name"]}_${dbColumn["column_name"]}_seq`;

                    const isGenerated = !!dbColumn["column_default"]
                        && (dbColumn["column_default"].replace(/"/gi, "") === `nextval('${seqName}'::regclass)` || /^uuid\_generate\_v\d\(\)/.test(dbColumn["column_default"]));
                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["column_name"];
                    tableColumn.type = dbColumn["data_type"].toLowerCase();
                    tableColumn.length = dbColumn["character_maximum_length"] ? dbColumn["character_maximum_length"].toString() : "";
                    tableColumn.precision = dbColumn["numeric_precision"];
                    tableColumn.scale = dbColumn["numeric_scale"];
                    tableColumn.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"].replace(/::character varying/, "") : undefined;
                    tableColumn.isNullable = dbColumn["is_nullable"] === "YES";
                    // tableColumn.isPrimary = dbColumn["column_key"].indexOf("PRI") !== -1;
                    tableColumn.isGenerated = isGenerated;
                    tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    tableColumn.charset = dbColumn["character_set_name"];
                    tableColumn.collation = dbColumn["collation_name"];
                    tableColumn.isUnique = !!dbUniqueKeys.find(key => key["constraint_name"] ===  `uk_${dbColumn["table_name"]}_${dbColumn["column_name"]}`);
                    if (tableColumn.type === "array") {
                        tableColumn.isArray = true;
                        const type = dbColumn["udt_name"].substring(1);
                        tableColumn.type = this.connection.driver.normalizeType({type: type});
                    }

                    if (tableColumn.type === "time without time zone"
                        || tableColumn.type === "time with time zone"
                        || tableColumn.type === "timestamp without time zone"
                        || tableColumn.type === "timestamp with time zone") {
                        tableColumn.precision = dbColumn["datetime_precision"];
                    }
                    return tableColumn;
                });

            // create primary key schema
            table.primaryKeys = primaryKeys
                .filter(primaryKey => primaryKey["table_name"] === table.name)
                .map(primaryKey => new TablePrimaryKey(primaryKey["constraint_name"], primaryKey["column_name"]));

            // create foreign key schemas from the loaded indices
            table.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["table_name"] === table.name)
                .map(dbForeignKey => new TableForeignKey(dbForeignKey["constraint_name"], [], [], "", "")); // todo: fix missing params

            // create unique key schemas from the loaded indices
            /*table.uniqueKeys = dbUniqueKeys
                .filter(dbUniqueKey => dbUniqueKey["table_name"] === table.name)
                .map(dbUniqueKey => {
                    return new UniqueKeySchema(dbUniqueKey["TABLE_NAME"], dbUniqueKey["CONSTRAINT_NAME"], [/!* todo *!/]);
                });*/

            // create index schemas from the loaded indices
            table.indices = dbIndices
                .filter(dbIndex => {
                    return dbIndex["table_name"] === table.name &&
                        (!table.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["index_name"])) &&
                        (!table.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["index_name"])) &&
                        (!dbUniqueKeys.find(key => key["constraint_name"] === dbIndex["index_name"]));
                })
                .map(dbIndex => dbIndex["index_name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const dbIndicesInfos = dbIndices
                        .filter(dbIndex => dbIndex["table_name"] === table.name && dbIndex["index_name"] === dbIndexName);
                    const columnPositions = dbIndicesInfos[0]["indkey"].split(" ")
                        .map((x: string) => parseInt(x));
                    const columnNames = columnPositions
                        .map((pos: number) => dbIndicesInfos.find(idx => idx.attnum === pos)!["column_name"]);

                    return new TableIndex(dbTable["table_name"], dbIndexName, columnNames, dbIndicesInfos[0]["is_unique"]);
                });

            return table;
        });
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tablePath: string): Promise<boolean> {
        const parsedTablePath = this.parseTablePath(tablePath);
        const sql = `SELECT * FROM information_schema.tables WHERE table_schema = ${parsedTablePath.schema} AND table_name = ${parsedTablePath.tableName}`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a database if it's not created.
     * Postgres does not supports database creation inside a transaction block.
     */
    createDatabase(database: string): Promise<void[]> {
        return Promise.resolve([]);
    }

    /**
     * Creates a schema if it's not created.
     */
    async createSchema(schemas: string[]): Promise<void[]> {
        if (this.driver.options.schema)
            schemas.push(this.driver.options.schema);
        return Promise.all(schemas.map(schema => this.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)));
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: Table): Promise<void> {
        const schema = table.schema || this.driver.options.schema;
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let up = `CREATE TABLE ${this.escapeTablePath(table)} (${columnDefinitions}`;
        up += table.columns
            .filter(column => column.isUnique)
            .map(column => {
                return schema ? `, CONSTRAINT "uk_${schema}_${table.name}_${column.name}" UNIQUE ("${column.name}")`
                              : `, CONSTRAINT "uk_${table.name}_${column.name}" UNIQUE ("${column.name}")`;
            }).join(" ");
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            up += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        up += `)`;

        const down = `DROP TABLE "${table.name}"`;
        await this.schemaQuery(up, down);
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
        const sql = `SELECT * FROM information_schema.columns WHERE table_schema = ${parsedTablePath.schema} AND table_name = '${parsedTablePath.tableName}' AND column_name = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrPath: Table|string, column: TableColumn): Promise<void> {
        const up = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} ADD ${this.buildCreateColumnSql(column, false)}`;
        const down = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} DROP "${column.name}"`;
        return this.schemaQuery(up, down);
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
        const sql: Array<{up: string, down: string}> = [];

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

        if (this.connection.driver.createFullType(oldColumn) !== this.connection.driver.createFullType(newColumn) ||
            oldColumn.name !== newColumn.name) {

            let up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ALTER COLUMN "${oldColumn.name}"`;
            if (this.connection.driver.createFullType(oldColumn) !== this.connection.driver.createFullType(newColumn)) {
                up += ` TYPE ${this.connection.driver.createFullType(newColumn)}`;
            }
            if (oldColumn.name !== newColumn.name) { // todo: make rename in a separate query too. Need also change sequences and their defaults
                up += ` RENAME TO ` + newColumn.name;
            }
            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        if (oldColumn.isNullable !== newColumn.isNullable) {
            let up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ALTER COLUMN "${oldColumn.name}"`;
            if (newColumn.isNullable) {
                up += ` DROP NOT NULL`;
            } else {
                up += ` SET NOT NULL`;
            }

            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        // update sequence generation
        if (oldColumn.isGenerated !== newColumn.isGenerated) {
            const schema = table.schema || this.driver.options.schema;
            if (!oldColumn.isGenerated && newColumn.type !== "uuid") {
                const up = schema
                    ? `CREATE SEQUENCE "${schema}"."${table.name}_${oldColumn.name}_seq" OWNED BY ${this.escapeTablePath(table)}."${oldColumn.name}"`
                    : `CREATE SEQUENCE "${table.name}_${oldColumn.name}_seq" OWNED BY ${this.escapeTablePath(table)}."${oldColumn.name}"`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

                const up2 = schema
                    ? `ALTER TABLE ${this.escapeTablePath(table)} ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${schema}.${table.name}_${oldColumn.name}_seq"')`
                    : `ALTER TABLE ${this.escapeTablePath(table)} ALTER COLUMN "${oldColumn.name}" SET DEFAULT nextval('"${table.name}_${oldColumn.name}_seq"')`;
                sql.push({up: up2, down: `-- TODO: revert ${up2}`}); // TODO: Add revert logic
            } else {
                const up = `ALTER TABLE ${this.escapeTablePath(table)} ALTER COLUMN "${oldColumn.name}" DROP DEFAULT`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

                const up2 = schema
                    ? `DROP SEQUENCE "${schema}"."${table.name}_${oldColumn.name}_seq"`
                    : `DROP SEQUENCE "${table.name}_${oldColumn.name}_seq"`;
                sql.push({up: up2, down: `-- TODO: revert ${up2}`}); // TODO: Add revert logic
            }
        }

        if (oldColumn.comment !== newColumn.comment) {
            const up = `COMMENT ON COLUMN ${this.escapeTablePath(tableOrName)}."${oldColumn.name}" is '${newColumn.comment}'`;
            sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
        }

        if (oldColumn.isUnique !== newColumn.isUnique) {
            if (newColumn.isUnique === true) {
                const up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ADD CONSTRAINT "uk_${table.name}_${newColumn.name}" UNIQUE ("${newColumn.name}")`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            } else if (newColumn.isUnique === false) {
                const up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} DROP CONSTRAINT "uk_${table.name}_${newColumn.name}"`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            }

        }

        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                const up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                const up = `ALTER TABLE ${this.escapeTablePath(tableOrName)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`;
                sql.push({up, down: `-- TODO: revert ${up}`}); // TODO: Add revert logic
            }
        }

        await Promise.all(sql.map(({up, down}) => this.schemaQuery(up, down)));
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
        const up = `ALTER TABLE ${this.escapeTablePath(table)} DROP "${column.name}"`;
        const down = `ALTER TABLE ${this.escapeTablePath(table)} ADD ${this.buildCreateColumnSql(column, false)}`;

        return this.schemaQuery(up, down);
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
        const primaryColumnNames = table.primaryKeys.map(primaryKey => `"${primaryKey.columnName}"`);

        const up = `ALTER TABLE ${this.escapeTablePath(table)} DROP CONSTRAINT IF EXISTS "${table.name}_pkey"`;
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic

        const up2 = `DROP INDEX IF EXISTS "${table.name}_pkey"`;
        const down2 = `-- TODO: revert ${up2}`;
        await this.schemaQuery(up2, down2); // TODO: Add revert logic

        if (primaryColumnNames.length > 0) {
            const up3 = `ALTER TABLE ${this.escapeTablePath(table)} ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            const down3 = `ALTER TABLE ${this.escapeTablePath(table)} DROP PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            await this.schemaQuery(up3, down3);
        }
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const {add: up, drop: down} = this.foreignKeySql(tableOrName, foreignKey);
        return this.schemaQuery(up, down);
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
    async dropForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const {add: down, drop: up} = this.foreignKeySql(tableOrName, foreignKey);
        return this.schemaQuery(up, down);
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
    async createIndex(tablePath: string, index: TableIndex): Promise<void> {
        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");

        const up = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTablePath(tablePath)}(${columnNames})`;
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableSchemeOrPath: Table|string, indexName: string): Promise<void> {
        const schema = this.extractSchema(tableSchemeOrPath);
        const up = schema ? `DROP INDEX "${schema}"."${indexName}"` : `DROP INDEX "${indexName}"`; // todo: make sure DROP INDEX should not be used here
        const down = `-- TODO: revert ${up}`;
        await this.schemaQuery(up, down); // TODO: Add revert logic
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
    async clearDatabase(schemas?: string[]): Promise<void> {
        if (!schemas)
            schemas = [];
        schemas.push(this.driver.options.schema || "current_schema()");
        const schemaNamesString = schemas.map(name => {
            return name === "current_schema()" ? name : "'" + name + "'";
        }).join(", ");

        await this.startTransaction();
        try {
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || schemaname || '"."' || tablename || '" CASCADE;' as query FROM pg_tables WHERE schemaname IN (${schemaNamesString})`;
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

  /**
   * Executes sql used special for schema build.
   */
    protected async schemaQuery(upQuery: string, downQuery: string): Promise<void> {
        // if sql-in-memory mode is enabled then simply store sql in memory and return
        if (this.sqlMemoryMode === true) {
          this.sqlsInMemory.push({up: upQuery, down: downQuery});
          return Promise.resolve() as Promise<any>;
        }

        await this.query(upQuery);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts schema name from given Table object or tablePath string.
     */
    protected extractSchema(tableOrPath: Table|string): string|undefined {
        if (tableOrPath instanceof Table) {
            return tableOrPath.schema || this.driver.options.schema;
        } else {
            return tableOrPath.indexOf(".") === -1 ? this.driver.options.schema : tableOrPath.split(".")[0];
        }
    }

    protected foreignKeySql(tableOrPath: Table|string, foreignKey: TableForeignKey): { add: string, drop: string } {
        let add = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY ("${foreignKey.columnNames.join("\", \"")}") ` +
            `REFERENCES ${this.escapeTablePath(foreignKey.referencedTablePath)}("${foreignKey.referencedColumnNames.join("\", \"")}")`;

        if (foreignKey.onDelete) add += " ON DELETE " + foreignKey.onDelete;
        const drop = `ALTER TABLE ${this.escapeTablePath(tableOrPath)} DROP CONSTRAINT "${foreignKey.name}"`;

        return {add, drop};
    }

    /**
     * Escapes given table path.
     */
    protected escapeTablePath(tableOrPath: Table|string, disableEscape?: boolean): string {
        if (tableOrPath instanceof Table) {
            const schema = tableOrPath.schema || this.driver.options.schema;
            if (schema) {
                tableOrPath = `${schema}.${tableOrPath.name}`;
            } else {
                tableOrPath = tableOrPath.name;
            }
        } else {
            tableOrPath = tableOrPath.indexOf(".") === -1 && this.driver.options.schema ? this.driver.options.schema + "." + tableOrPath : tableOrPath;
        }

        return tableOrPath.split(".").map(i => {
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected parseTablePath(tablePath: string): any {
        if (tablePath.indexOf(".") === -1) {
            return {
                schema: this.driver.options.schema ? `'${this.driver.options.schema}'` : "current_schema()",
                tableName: `'${tablePath}'`
            };
        } else {
            return {
                schema: `'${tablePath.split(".")[0]}'`,
                tableName: `'${tablePath.split(".")[1]}'`
            };
        }
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
    protected buildCreateColumnSql(column: TableColumn, skipPrimary: boolean) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true && column.generationStrategy === "increment") { // don't use skipPrimary here since updates can update already exist primary without auto inc.
            if (column.type === "integer")
                c += " SERIAL";
            if (column.type === "smallint")
                c += " SMALLSERIAL";
            if (column.type === "bigint")
                c += " BIGSERIAL";
        }
        if (!column.isGenerated || column.type === "uuid")
            c += " " + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET \"" + column.charset + "\"";
        if (column.collation)
            c += " COLLATE \"" + column.collation + "\"";
        if (column.isNullable !== true)
            c += " NOT NULL";
        // if (column.isPrimary)
        //     c += " PRIMARY KEY";
        if (column.default !== undefined && column.default !== null) { // todo: same code in all drivers. make it DRY
            c += " DEFAULT " + column.default;
        }
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";
        return c;
    }

}
