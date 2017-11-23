import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {PostgresDriver} from "./PostgresDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {QueryFailedError} from "../../error/QueryFailedError";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";

/**
 * Runs queries on a single postgres database connection.
 */
export class PostgresQueryRunner extends BaseQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: PostgresDriver;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Special callback provided by a driver used to release a created connection.
     */
    protected releaseCallback: Function;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: PostgresDriver, mode: "master"|"slave" = "master") {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.mode = mode;
        this.broadcaster = new Broadcaster(this);
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
     * Inserts rows into closure table.
     *
     * todo: rethink its place
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", "${newEntityId}", "level" + 1 FROM ${this.escapeTableName(tableName)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT "${newEntityId}", "${newEntityId}", 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTableName(tableName)}("ancestor", "descendant") ` +
                `SELECT "ancestor", "${newEntityId}" FROM ${this.escapeTableName(tableName)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT "${newEntityId}", "${newEntityId}"`;
        }
        await this.query(sql);
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.escapeTableName(tableName)} WHERE descendant = ${parentId}`);
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        } else {
            return -1;
        }
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        return Promise.resolve([]);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([]);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM "information_schema"."schemata" WHERE "schema_name" = '${schema}'`);
        return result.length ? true : false;
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM information_schema.tables WHERE table_schema = ${parsedTableName.schema} AND table_name = ${parsedTableName.tableName}`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     * Postgres does not supports database creation inside a transaction block.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        await Promise.resolve();
    }

    /**
     * Drops database.
     * Postgres does not supports database drop inside a transaction block.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `CREATE SCHEMA IF NOT EXISTS "${schema}"` : `CREATE SCHEMA "${schema}"`;
        const down = `DROP SCHEMA "${schema}" CASCADE`;
        await this.executeQueries(up, down);
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void> {
        const schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[0];
        const up = ifExist ? `DROP SCHEMA IF EXISTS "${schema}" ${isCascade ? "CASCADE" : ""}` : `DROP SCHEMA "${schema}" ${isCascade ? "CASCADE" : ""}`;
        const down = `CREATE SCHEMA "${schema}"`;
        await this.executeQueries(up, down);
    }

    /**
     * Creates a new table.
     */
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {

                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames);
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(table, index));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the table.
     */
    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {
        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        const tableName = target instanceof Table ? target.name : target;
        const table = await this.getCachedTable(tableName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(table);
            if (!isTableExist) return Promise.resolve();
        }

        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(table, index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        const oldFullTableName = oldTableOrName instanceof Table ? oldTableOrName.name : oldTableOrName;
        const oldTableName = oldFullTableName.indexOf(".") === -1 ? oldFullTableName : oldFullTableName.split(".")[1];

        const newFullTableName = newTableOrName instanceof Table ? newTableOrName.name : newTableOrName;
        const newTableName = newFullTableName.indexOf(".") === -1 ? newFullTableName : newFullTableName.split(".")[1];

        const up = `ALTER TABLE ${this.escapeTableName(oldFullTableName)} RENAME TO "${newTableName}"`;
        const down = `ALTER TABLE ${this.escapeTableName(newFullTableName)} RENAME TO "${oldTableName}"`;

        await this.executeQueries(up, down);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableName);
        const sql = `SELECT * FROM information_schema.columns WHERE table_schema = ${parsedTableName.schema} AND table_name = '${parsedTableName.tableName}' AND column_name = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);

        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            // if table already have primary key, me must drop it and recreate again
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
        }

        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
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
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        let newColumn;
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
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        if (oldColumn.name !== newColumn.name) {
            // rename column
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`);

            // rename column primary key constraint
            if (oldColumn.isPrimary === true) {
                const primaryColumns = clonedTable.primaryColumns;

                // build old primary constraint name
                const columnNames = primaryColumns.map(column => column.name);
                const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                // replace old column name with new column name
                columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                columnNames.push(newColumn.name);

                // build new primary constraint name
                const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
            }

            // rename column sequence
            if (oldColumn.isGenerated === true) {
                const schema = this.extractSchema(table);

                // building sequence name. Sequence without schema needed because it must be supplied in RENAME TO without
                // schema name, but schema needed in ALTER SEQUENCE argument.
                const seqName = this.buildSequenceName(table, oldColumn.name, undefined, true, true);
                const newSeqName = this.buildSequenceName(table, newColumn.name, undefined, true, true);

                const up = schema ? `ALTER SEQUENCE "${schema}"."${seqName}" RENAME TO "${newSeqName}"` : `ALTER SEQUENCE "${seqName}" RENAME TO "${newSeqName}"`;
                const down = schema ? `ALTER SEQUENCE "${schema}"."${newSeqName}" RENAME TO "${seqName}"` : `ALTER SEQUENCE "${newSeqName}" RENAME TO "${seqName}"`;
                upQueries.push(up);
                downQueries.push(down);
            }

            // rename unique constraints
            clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                unique.columnNames.push(newColumn.name);
                const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);
            });

            // rename index constraints
            clonedTable.findColumnIndices(oldColumn).forEach(index => {
                index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                index.columnNames.push(newColumn.name);
                const schema = this.extractSchema(table);
                const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames);

                const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
                const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
                upQueries.push(up);
                downQueries.push(down);
            });

            // rename foreign key constraints
            clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                foreignKey.columnNames.push(newColumn.name);
                const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);
            });

            // rename old column in the Table object
            const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
            clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
            oldColumn.name = newColumn.name;

            // TODO: rename fk
        }

        if (this.connection.driver.createFullType(oldColumn) !== this.connection.driver.createFullType(newColumn)) {
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" TYPE ${this.connection.driver.createFullType(newColumn)}`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" TYPE ${this.connection.driver.createFullType(oldColumn)}`);
        }

        if (oldColumn.isNullable !== newColumn.isNullable) {
            if (newColumn.isNullable) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
            } else {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
            }
        }

        if (oldColumn.comment !== newColumn.comment) {
            upQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${oldColumn.name}" IS '${newColumn.comment}'`);
            downQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${newColumn.name}" IS '${oldColumn.comment}'`);
        }

        if (newColumn.isPrimary !== oldColumn.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;

            // if primary column state changed, we must always drop existed constraint.
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            }

            if (newColumn.isPrimary === true) {
                primaryColumns.push(newColumn);
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);

            } else if (newColumn.isPrimary === false) {
                const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                // if we have another primary keys, we must recreate constraint.
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                }
            }
        }

        if (newColumn.isUnique !== oldColumn.isUnique) {
            if (newColumn.isUnique === true) {
                const uniqueConstraint = new TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                    columnNames: [newColumn.name]
                });
                clonedTable.uniques.push(uniqueConstraint);
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);

            } else if (newColumn.isUnique === false) {
                const uniqueConstraint = table.uniques.find(unique => {
                    return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                });
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
            }
        }

        if (oldColumn.isGenerated !== newColumn.isGenerated) {
            if (newColumn.isGenerated && newColumn.type !== "uuid") {
                upQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
                downQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);

            } else {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);

                upQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);
                downQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
            }
        }

        if (newColumn.default !== oldColumn.default) {
            if (newColumn.default !== null && newColumn.default !== undefined) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);

                if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
                } else {
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                }

            } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
            }
        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0 && primaryColumns.find(primaryColumn => primaryColumn.name === column.name)) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            primaryColumns.splice(primaryColumns.indexOf(column), 1);

            // if primary key have multiple columns, we must recreate it without dropped column
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            }
        }

        if (column.isUnique) {
            const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
            const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
            if (foundUnique)
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueName}" UNIQUE ("${column.name}")`);
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column)}`);

        await this.executeQueries(upQueries, downQueries);

        table.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getTable(tableOrName);
        const dropPromises = columns.map(column => this.dropColumn(table!, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     * TODO: check and fix
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
        /*if (!table.primaryKey)
            return Promise.resolve();
        const primaryColumnNames = table.primaryKey.columnNames.map(columnName => `"${columnName}"`);

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
        }*/
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();

        const up = this.createPrimaryKeySql(table, columnNames);

        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
        const down = this.dropPrimaryKeySql(clonedTable);

        await this.executeQueries(up, down);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.dropPrimaryKeySql(table);
        const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
        await this.executeQueries(up, down);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.addUniqueConstraint(uniqueConstraint);
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new Error(`Supplied unique constraint does not found in table ${table.name}`);

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.removeUniqueConstraint(uniqueConstraint);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
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
    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new Error(`Supplied foreign key does not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
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
    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new Error(`Supplied index does not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tableName)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        const schemas: string[] = [];
        this.connection.entityMetadatas
            .filter(metadata => metadata.schema)
            .forEach(metadata => {
                const isSchemaExist = !!schemas.find(schema => schema === metadata.schema);
                if (!isSchemaExist)
                    schemas.push(metadata.schema!);
            });
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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        const currentSchemaQuery = await this.query(`SELECT * FROM current_schema()`);
        const currentSchema = currentSchemaQuery[0]["current_schema"];

        const tablesCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("table_schema" = '${schema}' AND "table_name" = '${name}')`;
        }).join(" OR ");
        const tablesSql = `SELECT * FROM "information_schema"."tables" WHERE ` + tablesCondition;
        const columnsSql = `SELECT * FROM "information_schema"."columns" WHERE ` + tablesCondition;

        const constraintsCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("ns"."nspname" = '${schema}' AND "t"."relname" = '${name}')`;
        }).join(" OR ");
        const constraintsSql = `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", ` +
            `CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' ELSE 'INDEX' END as "constraint_type", ` +
            `"a"."attname" AS "column_name", CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE 'FALSE' END as "is_unique" ` +
            `FROM "pg_class" "t" ` +
            `INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" ` +
            `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid" AND "a"."attnum" = ANY("ix"."indkey") ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid"  = "t"."relnamespace" ` +
            `INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" ` +
            `LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" ` +
            `WHERE "t"."relkind" = 'r' AND ` + constraintsCondition;

        const foreignKeysCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("ns"."nspname" = '${schema}' AND "cl"."relname" = '${name}')`;
        }).join(" OR ");
        const foreignKeysSql = `SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", ` +
            `"ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_update", "con"."confupdtype" AS "on_delete" ` +
            `FROM ( ` +
            `SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", ` +
            `CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", ` +
            `CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" ` +
            `FROM "pg_class" "cl" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_constraint" "con1" ON "con1"."conrelid" = "cl"."oid" ` +
            `WHERE "con1"."contype" = 'f' AND (${foreignKeysCondition}) ` +
            `) "con" ` +
            `INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" ` +
            `INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"`;
        const [dbTables, dbColumns, dbConstraints, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(foreignKeysSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create tables for loaded tables
        return dbTables.map(dbTable => {
            const table = new Table();

            // We do not need to join schema name, when database is by default.
            // In this case we need local variable `tableFullName` for below comparision.
            const schema = dbTable["table_schema"] === currentSchema ? undefined : dbTable["table_schema"];
            table.name = this.driver.buildTableName(dbTable["table_name"], schema);
            const tableFullName = this.driver.buildTableName(dbTable["table_name"], dbTable["table_schema"]);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["table_name"], dbColumn["table_schema"]) === tableFullName)
                .map(dbColumn => {

                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName && dbConstraint["column_name"] === dbColumn["column_name"];
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["column_name"];
                    tableColumn.type = dbColumn["data_type"].toLowerCase();
                    tableColumn.length = dbColumn["character_maximum_length"] ? dbColumn["character_maximum_length"].toString() : "";

                    if (tableColumn.type !== "integer") {
                        tableColumn.precision = dbColumn["numeric_precision"];
                        tableColumn.scale = dbColumn["numeric_scale"];
                    }

                    tableColumn.default = dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined ? dbColumn["column_default"].replace(/::character varying/, "") : undefined;
                    tableColumn.isNullable = dbColumn["is_nullable"] === "YES";
                    tableColumn.isPrimary = !!columnConstraints.find(constraint => constraint["constraint_type"] === "PRIMARY");

                    const uniqueConstraint = columnConstraints.find(constraint => constraint["constraint_type"] === "UNIQUE");
                    const isConstraintComposite = uniqueConstraint
                        ? !!dbConstraints.find(dbConstraint => dbConstraint["constraint_type"] === "UNIQUE"
                            && dbConstraint["constraint_name"] === uniqueConstraint["constraint_name"]
                            && dbConstraint["column_name"] !== dbColumn["column_name"])
                        : false;
                    tableColumn.isUnique = !!uniqueConstraint && !isConstraintComposite;

                    if (dbColumn["column_default"]) {
                        if (dbColumn["column_default"].replace(/"/gi, "") === `nextval('${this.buildSequenceName(table, dbColumn["column_name"], currentSchema, true)}'::regclass)`) {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "increment";
                            tableColumn.default = undefined;
                        } else if (/^uuid_generate_v\d\(\)/.test(dbColumn["column_default"])) {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "uuid";
                            tableColumn.default = undefined;
                        }
                    }

                    tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    tableColumn.charset = dbColumn["character_set_name"];
                    tableColumn.collation = dbColumn["collation_name"];
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

            // find unique constraints of table, group them by constraint name and build TableUnique.
            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName
                    && dbConstraint["constraint_type"] === "UNIQUE";
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
                return new TableUnique({
                    name: constraint["constraint_name"],
                    columnNames: uniques.map(u => u["column_name"])
                });
            });

            // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return this.driver.buildTableName(dbForeignKey["table_name"], dbForeignKey["table_schema"]) === tableFullName;
            }), dbForeignKey => dbForeignKey["constraint_name"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["constraint_name"] === dbForeignKey["constraint_name"]);
                return new TableForeignKey({
                    name: dbForeignKey["constraint_name"],
                    columnNames: foreignKeys.map(dbFk => dbFk["column_name"]),
                    referencedTableName: this.driver.buildTableName(dbForeignKey["referenced_table_name"], dbForeignKey["referenced_table_schema"]),
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["referenced_column_name"]),
                    onDelete: dbForeignKey["on_delete"],
                    onUpdate: dbForeignKey["on_update"]
                });
            });

            // find index constraints of table, group them by constraint name and build TableIndex.
            const tableIndexConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName
                    && dbConstraint["constraint_type"] === "INDEX";
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbConstraints.filter(index => index["constraint_name"] === constraint["constraint_name"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["constraint_name"],
                    columnNames: indices.map(i => i["column_name"]),
                    isUnique: constraint["is_unique"] === "TRUE"
                });
            });

            return table;
        });
    }

    /**
     * Builds create table sql.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueExist = !!table.uniques.find(unique => {
                    return !!(unique.columnNames.length === 1 && unique.columnNames.find(columnName => columnName === column.name));
                });
                if (!isUniqueExist)
                    table.uniques.push(new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                        columnNames: [column.name]
                    }));
            });

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");

            sql += `, ${uniquesSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }

        sql += `)`;

        return sql;
    }

    /**
     * Extracts schema name from given Table object or table name string.
     */
    protected extractSchema(target: Table|string): string|undefined {
        const tableName = target instanceof Table ? target.name : target;
        return tableName.indexOf(".") === -1 ? this.driver.options.schema : tableName.split(".")[0];
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(tableOrPath: Table|string): string {
        return `DROP TABLE ${this.escapeTableName(tableOrPath)}`;
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTableName(table)}(${columns})`;
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        const schema = this.extractSchema(table);
        return schema ? `DROP INDEX "${schema}"."${indexName}"` : `DROP INDEX "${indexName}"`;
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`;
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): string {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${primaryKeyName}"`;
    }

    /**
     * Builds create unique constraint sql.
     */
    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): string {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`;
    }

    /**
     * Builds drop unique constraint sql.
     */
    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): string {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`;
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql;
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${foreignKeyName}"`;
    }

    /**
     * Builds sequence name from given table and column.
     */
    protected buildSequenceName(table: Table, columnOrName: TableColumn|string, currentSchema?: string, disableEscape?: true, skipSchema?: boolean): string {
        const columnName = columnOrName instanceof TableColumn ? columnOrName.name : columnOrName;
        let schema: string|undefined = undefined;
        let tableName: string|undefined = undefined;

        if (table.name.indexOf(".") === -1) {
            tableName = table.name;
        } else {
            schema = table.name.split(".")[0];
            tableName = table.name.split(".")[1];
        }

        if (schema && schema !== currentSchema && !skipSchema) {
            return disableEscape ? `${schema}.${tableName}_${columnName}_seq` : `"${schema}"."${tableName}_${columnName}_seq"`;

        } else {
            return disableEscape ? `${tableName}_${columnName}_seq` : `"${tableName}_${columnName}_seq"`;
        }
    }

    /**
     * Escapes given table path.
     */
    protected escapeTableName(target: Table|string, disableEscape?: boolean): string {
        let tableName = target instanceof Table ? target.name : target;
        tableName = tableName.indexOf(".") === -1 && this.driver.options.schema ? `${this.driver.options.schema}.${tableName}` : tableName;

        return tableName.split(".").map(i => {
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    /**
     * Returns object with table schema and table name.
     */
    protected parseTableName(target: Table|string): any {
        const tableName = target instanceof Table ? target.name : target;
        if (tableName.indexOf(".") === -1) {
            return {
                schema: this.driver.options.schema ? `'${this.driver.options.schema}'` : "current_schema()",
                tableName: `'${tableName}'`
            };
        } else {
            return {
                schema: `'${tableName.split(".")[0]}'`,
                tableName: `'${tableName.split(".")[1]}'`
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
    protected buildCreateColumnSql(column: TableColumn) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true && column.generationStrategy === "increment") {
            if (column.type === "integer" || column.type === "int")
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
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";

        return c;
    }

}
