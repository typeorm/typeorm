import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {MysqlDriver} from "./MysqlDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {OrmUtils} from "../../util/OrmUtils";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {Broadcaster} from "../../subscriber/Broadcaster";

/**
 * Runs queries on a single mysql database connection.
 */
export class MysqlQueryRunner extends BaseQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: MysqlDriver;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection from a pool for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: MysqlDriver, mode: "master"|"slave" = "master") {
        super();
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
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated) {

            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(connection => {
                this.databaseConnection = connection;
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
        if (this.databaseConnection)
            this.databaseConnection.release();
        return Promise.resolve();
    }

    /**
     * Starts transaction on the current connection.
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
     * Executes a raw SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
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
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result);
                });

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(query, parameters);
                if (onEnd) stream.on("end", onEnd);
                if (onError) stream.on("error", onError);
                ok(stream);

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        if (hasLevel) {
            await this.query(
                `INSERT INTO ${this.escapeTableName(tableName)}(\`ancestor\`, \`descendant\`, \`level\`) ` +
                `SELECT \`ancestor\`, \`${newEntityId}\`, \`level\` + 1 FROM ${this.escapeTableName(tableName)} WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT \`${newEntityId}\`, \`${newEntityId}\`, 1`
            );
        } else {
            await this.query(
                `INSERT INTO ${this.escapeTableName(tableName)}(\`ancestor\`, \`descendant\`) ` +
                `SELECT \`ancestor\`, \`${newEntityId}\` FROM ${this.escapeTableName(tableName)} WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT \`${newEntityId}\`, \`${newEntityId}\``
            );
        }
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(\`level\`) as \`level\` FROM ${this.escapeTableName(tableName)} WHERE \`descendant\` = ${parentId}`);
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
        throw new Error(`MySql driver does not support table schemas`);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\` = '${database}'`);
        return result.length ? true : false;
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        throw new Error(`MySql driver does not support table schemas`);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableOrName: Table|string, column: TableColumn|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const columnName = column instanceof TableColumn ? column.name : column;
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}' AND \`COLUMN_NAME\` = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `CREATE DATABASE IF NOT EXISTS \`${database}\`` : `CREATE DATABASE \`${database}\``;
        const down = `DROP DATABASE \`${database}\``;
        await this.executeQueries(up, down);
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist ? `DROP DATABASE IF EXISTS \`${database}\`` : `DROP DATABASE \`${database}\``;
        const down = `CREATE DATABASE \`${database}\``;
        await this.executeQueries(up, down);
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by MySql driver.`);
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by MySql driver.`);
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

        upQueries.push(this.createTableSql(table, createForeignKeys, createIndices));
        downQueries.push(this.dropTableSql(table));

        // we must first drop indices, than drop foreign keys, because drop queries runs in reversed order
        // and foreign keys will be dropped first as indices. This order is very important, because we can't drop index
        // if it related to the foreign key.

        // if createIndices is true, we must drop created indices in down query.
        // createTable does not need separate method to create indices, because it create indices in the same query with table creation.
        if (createIndices)
            table.indices.forEach(index => downQueries.push(this.dropIndexSql(table, index)));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        return this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drop the table.
     */
    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {
        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        // if dropTable called with dropIndices = true, we must create indices in down query.
        const createIndices: boolean = dropIndices;
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

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (dropIndices)
            table.indices.forEach(index => upQueries.push(this.dropIndexSql(table, index)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys, createIndices));

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Renames a table.
     */
    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        const oldTableName = oldTableOrName instanceof Table ? oldTableOrName.name : oldTableOrName;
        const newTableName = newTableOrName instanceof Table ? newTableOrName.name : newTableOrName;

        const up = `RENAME TABLE ${this.escapeTableName(oldTableName)} TO ${this.escapeTableName(newTableName)}`;
        const down = `RENAME TABLE ${this.escapeTableName(newTableName)} TO ${this.escapeTableName(oldTableName)}`;

        await this.executeQueries(up, down);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];
        const skipColumnLevelPrimary = table.primaryColumns.length > 0;

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, skipColumnLevelPrimary)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN \`${column.name}\``);

        if (column.isPrimary && skipColumnLevelPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
            }

            primaryColumns.push(column);
            const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
        }

        if (column.isUnique) {
            const uniqueIndex = new TableIndex({
                name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                columnNames: [column.name],
                isUnique: true
            });
            clonedTable.indices.push(uniqueIndex);
            clonedTable.uniques.push(new TableUnique({
                name: uniqueIndex.name,
                columnNames: uniqueIndex.columnNames
            }));
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${column.name}\`)`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex.name}\``);
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

        const newColumnName = newTableColumnOrName instanceof TableColumn ? newTableColumnOrName.name : newTableColumnOrName;

        const up = `ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` \`${newColumnName}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`;
        const down = `ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumnName}\` \`${oldColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`;

        await this.executeQueries(up, down);
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

        if (newColumn.isGenerated !== oldColumn.isGenerated) {
            if (newColumn.isGenerated === true) {
                if (newColumn.isPrimary === oldColumn.isPrimary && newColumn.isPrimary === true) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);

                } else if (newColumn.isPrimary !== oldColumn.isPrimary && newColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    if (primaryColumns.length > 0) {
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                    }

                    primaryColumns.push(newColumn);
                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);

                } else {
                    throw new Error(`Can not specify AUTO_INCREMENT on to non-primary column.`);
                }

            } else {
                if (newColumn.isPrimary === oldColumn.isPrimary && newColumn.isPrimary === true) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);

                } else if (newColumn.isPrimary !== oldColumn.isPrimary && newColumn.isPrimary === false) {
                    const primaryColumns = clonedTable.primaryColumns;

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);

                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);

                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    }

                }
            }
        } else {
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);

                } else if (newColumn.isPrimary === false) {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    }
                }
            }
        }

        if (newColumn.isUnique !== oldColumn.isUnique) {
            if (newColumn.isUnique === true) {
                const uniqueIndex = new TableIndex({
                    name: this.connection.namingStrategy.indexName(table.name, [newColumn.name]),
                    columnNames: [newColumn.name],
                    isUnique: true
                });
                clonedTable.indices.push(uniqueIndex);
                clonedTable.uniques.push(new TableUnique({
                    name: uniqueIndex.name,
                    columnNames: uniqueIndex.columnNames
                }));
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${newColumn.name}\`)`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex.name}\``);

            } else if (newColumn.isUnique === false) {
                const uniqueIndex = table.indices.find(index => {
                    return index.columnNames.length === 1 && index.isUnique === true && !!index.columnNames.find(columnName => columnName === newColumn.name);
                });
                clonedTable.indices.splice(clonedTable.indices.indexOf(uniqueIndex!), 1);

                const tableUnique = clonedTable.uniques.find(unique => unique.name === uniqueIndex!.name);
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(tableUnique!), 1);

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex!.name}\``);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex!.name}\` (\`${newColumn.name}\`)`);
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
            const columnNames = primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);
            primaryColumns.splice(primaryColumns.indexOf(column), 1);

            // if primary key have multiple columns, we must recreate it without dropped column
            if (primaryColumns.length > 0) {
                const columnNames = primaryColumns.map(primaryColumn => `\'${primaryColumn.name}\'`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
            }
        }

        if (column.isUnique) {
            // we splice constraints both from table uniques and indices.
            const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
            const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
            if (foundUnique)
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);

            const indexName = this.connection.namingStrategy.indexName(table.name, [column.name]);
            const foundIndex = clonedTable.indices.find(index => index.name === indexName);
            if (foundIndex)
                clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);

            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${indexName}\``);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${indexName}\` (\`${column.name}\`)`);
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN \`${column.name}\``);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, true)}`);

        await this.executeQueries(upQueries, downQueries);

        table.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(tableOrName, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     * TODO: maybe deleted
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
        /*if (!table.hasGeneratedColumn)
            await this.query(`ALTER TABLE \`${this.escapeTableName(table)}\` DROP PRIMARY KEY`);

        const primaryColumnNames = table.columns
            .filter(column => column.isPrimary && !column.isGenerated)
            .map(column => "`" + column.name + "`");
        if (primaryColumnNames.length > 0) {
            const sql = `ALTER TABLE \`${this.escapeTableName(table)}\` ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            const revertSql = `ALTER TABLE \`${this.escapeTableName(table)}\` DROP PRIMARY KEY`;
            return this.executeQueries(sql, revertSql);
        }*/
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();

        const up = this.createPrimaryKeySql(table, columnNames);
        const down = this.dropPrimaryKeySql(table);

        await this.executeQueries(up, down);
        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
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
        throw new Error(`MySql does not supports unique constraints. Use unique index instead.`);
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        throw new Error(`MySql does not supports unique constraints. Use unique index instead.`);
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
     * Drops a foreign key.
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
     * Drops an index.
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
    async clearTable(tableOrName: Table|string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tableOrName)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(): Promise<void> {
        if (!this.driver.database)
            throw new Error(`Can not clear database. No database is specified`);

        await this.startTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS query FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE \`TABLE_SCHEMA\` = '${this.driver.database}'`;
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

            await this.query(disableForeignKeysCheckQuery);
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
            await this.query(enableForeignKeysCheckQuery);

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
     * Returns current database.
     */
    protected async getCurrentDatabase(): Promise<string> {
        const currentDBQuery = await this.query(`SELECT DATABASE() AS \`db_name\``);
        return currentDBQuery[0]["db_name"];
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        const currentDatabase = await this.getCurrentDatabase();
        const dbNames = tableNames
            .filter(tableName => tableName.indexOf(".") !== -1)
            .map(tableName => tableName.split(".")[0]);
        if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
            dbNames.push(this.driver.database);

        const dbNamesString = dbNames.map(dbName => `'${dbName}'`).join(", ");
        const tablesCondition = tableNames.map(tableName => {
            let [database, name] = tableName.split(".");
            if (!name) {
                name = database;
                database = this.driver.database || currentDatabase;
            }
            return `\`TABLE_SCHEMA\` = '${database}' AND \`TABLE_NAME\` = '${name}'`;
        }).join(" OR ");
// TODO conditions
        const tablesSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE `  + tablesCondition;
        const columnsSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` IN (${dbNamesString})`;
        const indicesSql = `SELECT \`s\`.* FROM \`INFORMATION_SCHEMA\`.\`STATISTICS\` \`s\` ` +
            `LEFT JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`s\`.\`INDEX_NAME\` = \`rc\`.\`CONSTRAINT_NAME\` ` +
            `WHERE \`s\`.\`TABLE_SCHEMA\` IN (${dbNamesString}) AND \`s\`.\`INDEX_NAME\` != 'PRIMARY' AND \`rc\`.\`CONSTRAINT_NAME\` IS NULL`;
        const foreignKeysSql = `SELECT \`kcu\`.\`TABLE_SCHEMA\`, \`kcu\`.\`TABLE_NAME\`, \`kcu\`.\`CONSTRAINT_NAME\`, \`kcu\`.\`COLUMN_NAME\`, \`kcu\`.\`REFERENCED_TABLE_SCHEMA\`, ` +
            `\`kcu\`.\`REFERENCED_TABLE_NAME\`, \`kcu\`.\`REFERENCED_COLUMN_NAME\`, \`rc\`.\`DELETE_RULE\` \`ON_DELETE\`, \`rc\`.\`UPDATE_RULE\` \`ON_UPDATE\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`kcu\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`rc\`.\`constraint_name\` = \`kcu\`.\`constraint_name\` ` +
            `WHERE \`kcu\`.\`TABLE_SCHEMA\` IN (${dbNamesString})`;
        const [dbTables, dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql)
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        const isMariaDb = this.driver.options.type === "mariadb";

        // create tables for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            // We do not need to join database name, when database is by default.
            // In this case we need local variable `tableFullName` for below comparision.
            const db = dbTable["TABLE_SCHEMA"] === currentDatabase ? undefined : dbTable["TABLE_SCHEMA"];
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, db);
            const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, dbTable["TABLE_SCHEMA"]);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], undefined, dbColumn["TABLE_SCHEMA"]) === tableFullName)
                .map(dbColumn => {
                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];

                    const columnType = dbColumn["COLUMN_TYPE"].toLowerCase();
                    const endIndex = columnType.indexOf("(");
                    tableColumn.type = endIndex !== -1 ? columnType.substring(0, endIndex) : columnType;

                    if (dbColumn["COLUMN_DEFAULT"] === null
                        || dbColumn["COLUMN_DEFAULT"] === undefined
                        || (isMariaDb && dbColumn["COLUMN_DEFAULT"] === "NULL")) {
                        tableColumn.default = undefined;

                    } else {
                        tableColumn.default = dbColumn["COLUMN_DEFAULT"] === "CURRENT_TIMESTAMP" ? dbColumn["COLUMN_DEFAULT"] : `'${dbColumn["COLUMN_DEFAULT"]}'`;
                    }

                    const columnIndex = dbIndices.find(dbIndex => {
                        return this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]) === tableFullName
                            && dbIndex["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] && dbIndex["NON_UNIQUE"] === 0;
                    });
                    const isIndexComposite = columnIndex
                        ? !!dbIndices.find(dbIndex => dbIndex["INDEX_NAME"] === columnIndex["INDEX_NAME"]
                            && dbIndex["NON_UNIQUE"] === 0
                            && dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;

                    if (dbColumn["COLUMN_KEY"].indexOf("UNI") !== -1 || (!!columnIndex && !isIndexComposite))
                        tableColumn.isUnique = true;

                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = dbColumn["COLUMN_KEY"].indexOf("PRI") !== -1;
                    tableColumn.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    if (tableColumn.isGenerated)
                        tableColumn.generationStrategy = "increment";
                    tableColumn.comment = dbColumn["COLUMN_COMMENT"];
                    tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                    tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    tableColumn.collation = dbColumn["COLLATION_NAME"];

                    if (tableColumn.type === "int" || tableColumn.type === "tinyint"
                        ||  tableColumn.type === "smallint" || tableColumn.type === "mediumint"
                        || tableColumn.type === "bigint" || tableColumn.type === "year") {

                        const length = columnType.substring(columnType.indexOf("(") + 1, columnType.indexOf(")"));
                        tableColumn.length = length ? length.toString() : "";

                    } else {
                        tableColumn.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString() : "";
                    }

                    if (tableColumn.type === "enum") {
                        const colType = dbColumn["COLUMN_TYPE"];
                        const items = colType.substring(colType.indexOf("(") + 1, colType.indexOf(")")).split(",");
                        tableColumn.enum = (items as string[]).map(item => {
                            return item.substring(1, item.length - 1);
                        });
                    }

                    if (tableColumn.type === "datetime" || tableColumn.type === "time" || tableColumn.type === "timestamp") {
                        tableColumn.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return tableColumn;
                });

            // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], undefined, dbForeignKey["TABLE_SCHEMA"]) === tableFullName;
            }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                return new TableForeignKey({
                    name: dbForeignKey["CONSTRAINT_NAME"],
                    columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                    referencedTableName: this.driver.buildTableName(dbForeignKey["REFERENCED_TABLE_NAME"], undefined, dbForeignKey["REFERENCED_TABLE_SCHEMA"]),
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                    onDelete: dbForeignKey["ON_DELETE"],
                    onUpdate: dbForeignKey["ON_UPDATE"]
                });
            });

            // find index constraints of table, group them by constraint name and build TableIndex.
            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]) === tableFullName;
            }), dbIndex => dbIndex["INDEX_NAME"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["INDEX_NAME"] === constraint["INDEX_NAME"]);
                const tableIndex = new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["INDEX_NAME"],
                    columnNames: indices.map(i => i["COLUMN_NAME"]),
                    isUnique: constraint["NON_UNIQUE"] === 0
                });

                if (tableIndex.isUnique === true)
                    table.uniques.push(new TableUnique({
                        name: tableIndex.name,
                        columnNames: tableIndex.columnNames
                    }));

                return tableIndex;
            });

            return table;
        }));
    }

    /**
     * Builds create table sql
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean, createIndices?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        // We create unique indexes instead of unique constraints, because MySql does not have unique constraints.
        // If we mark column as Unique, it means that we create UNIQUE INDEX.
        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueExist = !!table.indices.find(index => {
                    return !!(index.columnNames.length === 1 && index.isUnique && index.columnNames.find(columnName => columnName === column.name));
                });
                if (!isUniqueExist)
                    table.indices.push(new TableIndex({
                        name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                        columnNames: [column.name],
                        isUnique: true
                    }));
            });

        // As MySql does not have unique constraints, we must create table indices from table uniques and mark them as unique.
        if (table.uniques.length > 0) {
            table.uniques.forEach(unique => {
                table.indices.push(new TableIndex({
                    name: unique.name,
                    columnNames: unique.columnNames,
                    isUnique: true
                }));
            });
        }

        if (table.indices.length > 0 && createIndices) {
            const indicesSql = table.indices.map(index => {
                const columnNames = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames);

                return `${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` (${columnNames})`;
            }).join(", ");

            sql += `, ${indicesSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `\`${columnName}\``).join(", ");

                let constraint = `CONSTRAINT \`${fk.name}\` FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
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
            const hasAutoIncrement = primaryColumns.find(column => column.isGenerated && column.generationStrategy === "increment");
            if (primaryColumns.length > 1 && hasAutoIncrement)
                throw new Error(`MySql does not support AUTO_INCREMENT on composite primary key`);

            const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
        }

        sql += `) ENGINE=${table.engine || "InnoDB"}`;

        return sql;
    }

    /**
     * Builds drop table sql
     */
    protected dropTableSql(tableOrName: Table|string): string {
        return `DROP TABLE ${this.escapeTableName(tableOrName)}`;
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON ${this.escapeTableName(table)}(${columns})`;
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX \`${indexName}\` ON ${this.escapeTableName(table)}`;
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const columnNamesString = columnNames.map(columnName => `\`${columnName}\``).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNamesString})`;
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): string {
        return `ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`;
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
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
        return `ALTER TABLE ${this.escapeTableName(table)} DROP FOREIGN KEY \`${foreignKeyName}\``;
    }

    protected parseTableName(target: Table|string) {
        const tableName = target instanceof Table ? target.name : target;
        return {
            database: tableName.indexOf(".") !== -1 ? tableName.split(".")[0] : this.driver.database,
            tableName: tableName.indexOf(".") !== -1 ? tableName.split(".")[1] : tableName
        };
    }

    /**
     * Escapes given table name.
     */
    protected escapeTableName(target: Table|string, disableEscape?: boolean): string {
        const tableName = target instanceof Table ? target.name : target;
        return tableName.split(".").map(i => disableEscape ? i : `\`${i}\``).join(".");
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => `\`${key}\`=?`);
    }

    /**
     * Builds a part of query to create/change a column.
     */
    protected buildCreateColumnSql(column: TableColumn, skipPrimary: boolean, skipName: boolean = false) {
        let c = "";
        if (skipName) {
            c = this.connection.driver.createFullType(column);
        } else {
            c = "`" + column.name + "` " + this.connection.driver.createFullType(column);
        }
        if (column.enum)
            c += " (" + column.enum.map(value => "'" + value + "'").join(", ") +  ")";
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;

        return c;
    }

}
