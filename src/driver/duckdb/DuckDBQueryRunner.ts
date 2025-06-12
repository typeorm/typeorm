import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError"
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner"
import { QueryResult } from "../../query-runner/QueryResult"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { Table } from "../../schema-builder/table/Table"
import { TableCheck } from "../../schema-builder/table/TableCheck"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableExclusion } from "../../schema-builder/table/TableExclusion"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { TableIndex } from "../../schema-builder/table/TableIndex"
import { TableUnique } from "../../schema-builder/table/TableUnique"
import { View } from "../../schema-builder/view/View"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { IsolationLevel } from "../types/IsolationLevel"
import { ReplicationMode } from "../types/ReplicationMode"
import { DuckDBDriver } from "./DuckDBDriver"
import { MetadataTableType } from "../types/MetadataTableType"
import { InstanceChecker } from "../../util/InstanceChecker"
import { Query } from "../Query"

/**
 * Runs queries on a single DuckDB database connection.
 */
export class DuckDBQueryRunner extends BaseQueryRunner implements QueryRunner {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: DuckDBDriver

    /**
     * Database connection used by query runner.
     */
    databaseConnection: any

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: DuckDBDriver, mode?: ReplicationMode) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.mode = mode || "master"
        this.broadcaster = new Broadcaster(this)
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    async connect(): Promise<any> {
        if (this.databaseConnection) {
            return this.databaseConnection
        }

        this.databaseConnection = this.driver.databaseConnection
        this.driver.connectedQueryRunners.push(this)
        return this.databaseConnection
    }

    /**
     * Releases used database connection.
     */
    release(): Promise<void> {
        this.isReleased = true
        if (this.databaseConnection) {
            this.driver.connectedQueryRunners.splice(
                this.driver.connectedQueryRunners.indexOf(this),
                1,
            )
        }
        return Promise.resolve()
    }

    /**
     * Starts transaction.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (this.isTransactionActive) throw new TransactionAlreadyStartedError()

        await this.connect()
        await this.broadcaster.broadcast("BeforeTransactionStart")

        if (isolationLevel) {
            await this.query(
                `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`,
            )
        }
        await this.query("BEGIN")
        this.isTransactionActive = true

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")
        await this.query("COMMIT")
        this.isTransactionActive = false
        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")
        await this.query("ROLLBACK")
        this.isTransactionActive = false
        await this.broadcaster.broadcast("AfterTransactionRollback")
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()
        const broadcaster = this.broadcaster

        this.driver.connection.logger.logQuery(query, parameters, this)
        await broadcaster.broadcast("BeforeQuery", query, parameters)

        try {
            const queryStartTime = Date.now()
            const isSelectQuery = query
                .trim()
                .toLowerCase()
                .startsWith("select")
            const isInsertQuery = query
                .trim()
                .toLowerCase()
                .startsWith("insert")
            const isUpdateQuery = query
                .trim()
                .toLowerCase()
                .startsWith("update")
            const isDeleteQuery = query
                .trim()
                .toLowerCase()
                .startsWith("delete")

            let raw: any[] = []

            if (
                isSelectQuery ||
                query.trim().toLowerCase().startsWith("with")
            ) {
                // Use all() for SELECT queries that return multiple rows
                raw = await new Promise<any[]>((ok, fail) => {
                    databaseConnection.all(
                        query,
                        parameters || [],
                        (err: any, rows: any[]) => {
                            if (err)
                                return fail(
                                    new QueryFailedError(
                                        query,
                                        parameters,
                                        err,
                                    ),
                                )
                            ok(rows || [])
                        },
                    )
                })
            } else {
                // Use run() for INSERT/UPDATE/DELETE/DDL queries
                const result = await new Promise<any>((ok, fail) => {
                    databaseConnection.run(
                        query,
                        parameters || [],
                        function (this: any, err: any) {
                            if (err)
                                return fail(
                                    new QueryFailedError(
                                        query,
                                        parameters,
                                        err,
                                    ),
                                )
                            ok({
                                changes: this.changes,
                                lastID: this.lastID,
                            })
                        },
                    )
                })

                if (isInsertQuery && result.lastID) {
                    raw = [{ insertId: result.lastID }]
                } else if (isUpdateQuery || isDeleteQuery) {
                    raw = [{ affectedRows: result.changes }]
                } else {
                    raw = []
                }
            }

            // Log slow queries if necessary
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime

            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            ) {
                this.driver.connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )
            }

            const result = new QueryResult()

            if (useStructuredResult) {
                result.raw = raw
                result.records = raw
            } else {
                result.raw = raw
                result.records = raw
            }

            return useStructuredResult ? result : raw
        } catch (err) {
            this.driver.connection.logger.logQueryError(
                err as Error,
                query,
                parameters,
                this,
            )
            throw err
        }
    }

    /**
     * Returns raw data stream.
     */
    stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<any> {
        throw new TypeORMError(`Stream is not supported by DuckDB driver.`)
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        const results = await this.query(
            `SELECT database_name FROM duckdb_databases()`,
        )
        return results.map((result: any) => result.database_name)
    }

    /**
     * Returns all available schema names including system schemas.
     */
    async getSchemas(database?: string): Promise<string[]> {
        const query = database
            ? `SELECT schema_name FROM information_schema.schemata WHERE catalog_name = $1`
            : `SELECT schema_name FROM information_schema.schemata`
        const parameters = database ? [database] : undefined
        const results = await this.query(query, parameters)
        return results.map((result: any) => result.schema_name)
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(
            `SELECT database_name FROM duckdb_databases() WHERE database_name = $1`,
            [database],
        )
        return result.length > 0
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        const result = await this.query(
            `SELECT current_database() as database_name`,
        )
        return result[0].database_name
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(
            `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
            [schema],
        )
        return result.length > 0
    }

    /**
     * Loads currently using schema
     */
    async getCurrentSchema(): Promise<string> {
        const result = await this.query(
            `SELECT current_schema() as schema_name`,
        )
        return result[0].schema_name
    }

    /**
     * Checks if table with the given name exist in the given database.
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)

        const sql = `SELECT table_name FROM information_schema.tables WHERE table_name = $1`
        const parameters: any[] = [parsedTableName.tableName]

        if (parsedTableName.schema) {
            sql.replace("WHERE", "WHERE table_schema = $2 AND")
            parameters.push(parsedTableName.schema)
        }

        if (parsedTableName.database) {
            sql.replace("WHERE", "WHERE table_catalog = $3 AND")
            parameters.push(parsedTableName.database)
        }

        const result = await this.query(sql, parameters)
        return result.length > 0
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(
        tableOrName: Table | string,
        column: string,
    ): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)

        const sql = `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`
        const parameters: any[] = [parsedTableName.tableName, column]

        if (parsedTableName.schema) {
            sql.replace(
                "AND column_name",
                "AND table_schema = $3 AND column_name",
            )
            parameters.push(parsedTableName.schema)
        }

        const result = await this.query(sql, parameters)
        return result.length > 0
    }

    /**
     * Creates a new database.
     */
    async createDatabase(
        database: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        await this.query(`ATTACH '${database}' AS ${database}`)
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        await this.query(`DETACH ${database}`)
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(
        schemaPath: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        const schema = schemaPath.includes(".")
            ? schemaPath.split(".").pop()!
            : schemaPath

        const upQuery = ifNotExist
            ? `CREATE SCHEMA IF NOT EXISTS "${schema}"`
            : `CREATE SCHEMA "${schema}"`

        await this.query(upQuery)
    }

    /**
     * Drops table schema.
     */
    async dropSchema(
        schemaPath: string,
        ifExist?: boolean,
        cascade?: boolean,
    ): Promise<void> {
        const schema = schemaPath.includes(".")
            ? schemaPath.split(".").pop()!
            : schemaPath

        const upQuery = `DROP SCHEMA ${ifExist ? "IF EXISTS " : ""}"${schema}"${
            cascade ? " CASCADE" : ""
        }`

        await this.query(upQuery)
    }

    /**
     * Creates a new table.
     */
    async createTable(
        table: Table,
        ifNotExist: boolean = false,
        createForeignKeys: boolean = true,
        createIndices: boolean = true,
    ): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table)
            if (isTableExist) return Promise.resolve()
        }

        const upQueries: Query[] = []
        const downQueries: Query[] = []

        upQueries.push(this.createTableSql(table, createForeignKeys))

        if (createIndices) {
            table.indices
                .filter((index) => !index.isUnique)
                .forEach((index) => {
                    upQueries.push(this.createIndexSql(table, index))
                })
        }

        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drops the table.
     */
    async dropTable(
        target: Table | string,
        ifExist?: boolean,
        dropForeignKeys?: boolean,
        dropIndices?: boolean,
    ): Promise<void> {
        const tableName = InstanceChecker.isTable(target) ? target.name : target
        const parsedTableName = this.driver.parseTableName(tableName)

        const upQuery = `DROP TABLE ${
            ifExist ? "IF EXISTS " : ""
        }${this.driver.buildTableName(
            parsedTableName.tableName,
            parsedTableName.schema,
            parsedTableName.database,
        )}`

        await this.query(upQuery)
    }

    /**
     * Creates a new view.
     */
    async createView(
        view: View,
        syncWithMetadata?: boolean,
        oldView?: View,
    ): Promise<void> {
        const upQuery = this.createViewSql(view)
        const downQuery = this.dropViewSql(view)
        await this.executeQueries([upQuery], [downQuery])
    }

    /**
     * Drops the view.
     */
    async dropView(target: View | string): Promise<void> {
        const viewName = InstanceChecker.isView(target) ? target.name : target
        const query = `DROP VIEW "${viewName}"`
        await this.query(query)
    }

    /**
     * Renames the given table.
     */
    async renameTable(
        oldTableOrName: Table | string,
        newTableName: string,
    ): Promise<void> {
        const oldTableName = InstanceChecker.isTable(oldTableOrName)
            ? oldTableOrName.name
            : oldTableOrName

        const query = `ALTER TABLE "${oldTableName}" RENAME TO "${newTableName}"`
        await this.query(query)
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(
        tableOrName: Table | string,
        column: TableColumn,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const query = `ALTER TABLE "${table}" ADD COLUMN ${this.buildCreateColumnSql(
            column,
        )}`
        await this.query(query)
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        for (const column of columns) {
            await this.addColumn(tableOrName, column)
        }
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newTableColumnOrName: TableColumn | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const oldColumn = InstanceChecker.isTableColumn(oldTableColumnOrName)
            ? oldTableColumnOrName.name
            : oldTableColumnOrName
        const newColumn = InstanceChecker.isTableColumn(newTableColumnOrName)
            ? newTableColumnOrName.name
            : newTableColumnOrName

        const query = `ALTER TABLE "${table}" RENAME COLUMN "${oldColumn}" TO "${newColumn}"`
        await this.query(query)
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newColumn: TableColumn,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const oldColumn = InstanceChecker.isTableColumn(oldTableColumnOrName)
            ? oldTableColumnOrName.name
            : oldTableColumnOrName

        const query = `ALTER TABLE "${table}" ALTER COLUMN "${oldColumn}" TYPE ${this.driver.createFullType(
            newColumn,
        )}`
        await this.query(query)
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(
        tableOrName: Table | string,
        changedColumns: { newColumn: TableColumn; oldColumn: TableColumn }[],
    ): Promise<void> {
        for (const { oldColumn, newColumn } of changedColumns) {
            await this.changeColumn(tableOrName, oldColumn, newColumn)
        }
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(
        tableOrName: Table | string,
        columnOrName: TableColumn | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const column = InstanceChecker.isTableColumn(columnOrName)
            ? columnOrName.name
            : columnOrName

        const query = `ALTER TABLE "${table}" DROP COLUMN "${column}"`
        await this.query(query)
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        for (const column of columns) {
            await this.dropColumn(tableOrName, column)
        }
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(
        tableOrName: Table | string,
        columnNames: string[],
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const columnNamesString = columnNames
            .map((name) => `"${name}"`)
            .join(", ")
        const query = `ALTER TABLE "${table}" ADD PRIMARY KEY (${columnNamesString})`
        await this.query(query)
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const primaryColumns = columns.filter((column) => column.isPrimary)
        const columnNames = primaryColumns.map((column) => column.name)

        if (columnNames.length > 0) {
            await this.createPrimaryKey(table, columnNames)
        }
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table | string): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const query = `ALTER TABLE "${table}" DROP PRIMARY KEY`
        await this.query(query)
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(
        tableOrName: Table | string,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const columnNames = uniqueConstraint.columnNames
            .map((name) => `"${name}"`)
            .join(", ")
        const constraintName =
            uniqueConstraint.name ||
            `UQ_${table}_${uniqueConstraint.columnNames.join("_")}`

        const query = `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" UNIQUE (${columnNames})`
        await this.query(query)
    }

    /**
     * Creates new unique constraints.
     */
    async createUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        for (const uniqueConstraint of uniqueConstraints) {
            await this.createUniqueConstraint(tableOrName, uniqueConstraint)
        }
    }

    /**
     * Drops unique constraint.
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const uniqueName = InstanceChecker.isTableUnique(uniqueOrName)
            ? uniqueOrName.name!
            : uniqueOrName

        const query = `ALTER TABLE "${table}" DROP CONSTRAINT "${uniqueName}"`
        await this.query(query)
    }

    /**
     * Drops unique constraints.
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        for (const uniqueConstraint of uniqueConstraints) {
            await this.dropUniqueConstraint(tableOrName, uniqueConstraint)
        }
    }

    /**
     * Creates new check constraint.
     */
    async createCheckConstraint(
        tableOrName: Table | string,
        checkConstraint: TableCheck,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const query = `ALTER TABLE "${table}" ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`
        await this.query(query)
    }

    /**
     * Creates new check constraints.
     */
    async createCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        for (const checkConstraint of checkConstraints) {
            await this.createCheckConstraint(tableOrName, checkConstraint)
        }
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(
        tableOrName: Table | string,
        checkOrName: TableCheck | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const checkName = InstanceChecker.isTableCheck(checkOrName)
            ? checkOrName.name!
            : checkOrName

        const query = `ALTER TABLE "${table}" DROP CONSTRAINT "${checkName}"`
        await this.query(query)
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        for (const checkConstraint of checkConstraints) {
            await this.dropCheckConstraint(tableOrName, checkConstraint)
        }
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(
        tableOrName: Table | string,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const columnNames = foreignKey.columnNames
            .map((name) => `"${name}"`)
            .join(", ")
        const referencedColumnNames = foreignKey.referencedColumnNames
            .map((name) => `"${name}"`)
            .join(", ")
        const constraintName =
            foreignKey.name || `FK_${table}_${foreignKey.columnNames.join("_")}`

        let query = `ALTER TABLE "${table}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY (${columnNames}) REFERENCES "${foreignKey.referencedTableName}" (${referencedColumnNames})`

        if (foreignKey.onDelete) {
            query += ` ON DELETE ${foreignKey.onDelete}`
        }
        if (foreignKey.onUpdate) {
            query += ` ON UPDATE ${foreignKey.onUpdate}`
        }

        await this.query(query)
    }

    /**
     * Creates new foreign keys.
     */
    async createForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        for (const foreignKey of foreignKeys) {
            await this.createForeignKey(tableOrName, foreignKey)
        }
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(
        tableOrName: Table | string,
        foreignKeyOrName: TableForeignKey | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const foreignKeyName = InstanceChecker.isTableForeignKey(
            foreignKeyOrName,
        )
            ? foreignKeyOrName.name!
            : foreignKeyOrName

        const query = `ALTER TABLE "${table}" DROP CONSTRAINT "${foreignKeyName}"`
        await this.query(query)
    }

    /**
     * Drops foreign keys from the table.
     */
    async dropForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        for (const foreignKey of foreignKeys) {
            await this.dropForeignKey(tableOrName, foreignKey)
        }
    }

    /**
     * Creates a new index.
     */
    async createIndex(
        tableOrName: Table | string,
        index: TableIndex,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const columns = index.columnNames.map((name) => `"${name}"`).join(", ")
        const indexName =
            index.name || `IDX_${table}_${index.columnNames.join("_")}`

        const unique = index.isUnique ? "UNIQUE " : ""
        const query = `CREATE ${unique}INDEX "${indexName}" ON "${table}" (${columns})`
        await this.query(query)
    }

    /**
     * Creates new indices
     */
    async createIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
    ): Promise<void> {
        for (const index of indices) {
            await this.createIndex(tableOrName, index)
        }
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(
        tableOrName: Table | string,
        indexOrName: TableIndex | string,
    ): Promise<void> {
        const indexName = InstanceChecker.isTableIndex(indexOrName)
            ? indexOrName.name!
            : indexOrName
        const query = `DROP INDEX "${indexName}"`
        await this.query(query)
    }

    /**
     * Drops indices from the table.
     */
    async dropIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
    ): Promise<void> {
        for (const index of indices) {
            await this.dropIndex(tableOrName, index)
        }
    }

    /**
     * Clears all table contents.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`DELETE FROM "${tableName}"`)
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        // No special setup needed for DuckDB
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        // No special cleanup needed for DuckDB
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        const queries: string[] = []
        const dropTablesQuery = `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`
        const tables = await this.query(dropTablesQuery)

        tables.forEach((table: any) => {
            queries.push(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`)
        })

        for (const query of queries) {
            await this.query(query)
        }
    }

    /**
     * Changes table comment.
     */
    async changeTableComment(
        tableOrName: Table | string,
        newComment?: string,
    ): Promise<void> {
        // DuckDB doesn't support table comments, so this is a no-op
        return Promise.resolve()
    }

    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint(
        tableOrName: Table | string,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        // DuckDB doesn't support exclusion constraints, so this throws an error
        throw new TypeORMError("DuckDB does not support exclusion constraints")
    }

    /**
     * Creates new exclusion constraints.
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        // DuckDB doesn't support exclusion constraints, so this throws an error
        throw new TypeORMError("DuckDB does not support exclusion constraints")
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(
        tableOrName: Table | string,
        exclusionOrName: TableExclusion | string,
    ): Promise<void> {
        // DuckDB doesn't support exclusion constraints, so this throws an error
        throw new TypeORMError("DuckDB does not support exclusion constraints")
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        // DuckDB doesn't support exclusion constraints, so this throws an error
        throw new TypeORMError("DuckDB does not support exclusion constraints")
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async loadViews(viewNames?: string[]): Promise<View[]> {
        return []
    }

    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        return []
    }

    /**
     * Builds create table sql.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const columnDefinitions = table.columns
            .map((column) => this.buildCreateColumnSql(column))
            .join(", ")

        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`

        // Add constraints
        const primaryColumns = table.columns.filter(
            (column) => column.isPrimary,
        )
        if (primaryColumns.length > 0) {
            const primaryKeyNames = primaryColumns
                .map((column) => `"${column.name}"`)
                .join(", ")
            sql += `, PRIMARY KEY (${primaryKeyNames})`
        }

        table.uniques.forEach((unique) => {
            const uniqueConstraint = unique.columnNames
                .map((name) => `"${name}"`)
                .join(", ")
            sql += `, CONSTRAINT "${unique.name}" UNIQUE (${uniqueConstraint})`
        })

        table.checks.forEach((check) => {
            sql += `, CONSTRAINT "${check.name}" CHECK (${check.expression})`
        })

        if (createForeignKeys) {
            table.foreignKeys.forEach((foreignKey) => {
                const columnNames = foreignKey.columnNames
                    .map((name) => `"${name}"`)
                    .join(", ")
                const referencedColumnNames = foreignKey.referencedColumnNames
                    .map((name) => `"${name}"`)
                    .join(", ")
                sql += `, CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) REFERENCES "${foreignKey.referencedTableName}" (${referencedColumnNames})`

                if (foreignKey.onDelete) {
                    sql += ` ON DELETE ${foreignKey.onDelete}`
                }
                if (foreignKey.onUpdate) {
                    sql += ` ON UPDATE ${foreignKey.onUpdate}`
                }
            })
        }

        sql += ")"

        return new Query(sql)
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(
        tableOrName: Table | string,
        ifExist?: boolean,
    ): Query {
        const tableName = InstanceChecker.isTable(tableOrName)
            ? tableOrName.name
            : tableOrName
        const query = `DROP TABLE ${ifExist ? "IF EXISTS " : ""}"${tableName}"`
        return new Query(query)
    }

    protected createViewSql(view: View): Query {
        const materializedClause = view.materialized ? "MATERIALIZED " : ""
        const query = `CREATE ${materializedClause}VIEW "${view.name}" AS ${view.expression}`
        return new Query(query)
    }

    protected insertViewDefinitionSql(view: View): Query {
        return new Query(
            `INSERT INTO "${this.getTypeormMetadataTableName()}" ("type", "name", "value") VALUES ($1, $2, $3)`,
            [MetadataTableType.VIEW, view.name, view.expression],
        )
    }

    protected dropViewSql(viewOrPath: View | string): Query {
        const viewName = InstanceChecker.isView(viewOrPath)
            ? viewOrPath.name
            : viewOrPath
        return new Query(`DROP VIEW "${viewName}"`)
    }

    protected deleteViewDefinitionSql(viewOrPath: View | string): Query {
        const viewName = InstanceChecker.isView(viewOrPath)
            ? viewOrPath.name
            : viewOrPath
        return new Query(
            `DELETE FROM "${this.getTypeormMetadataTableName()}" WHERE "type" = $1 AND "name" = $2`,
            [MetadataTableType.VIEW, viewName],
        )
    }

    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames.map((name) => `"${name}"`).join(", ")
        const indexName =
            index.name || `IDX_${table.name}_${index.columnNames.join("_")}`
        const unique = index.isUnique ? "UNIQUE " : ""
        const query = `CREATE ${unique}INDEX "${indexName}" ON "${table.name}" (${columns})`
        return new Query(query)
    }

    protected dropIndexSql(
        table: Table,
        indexOrName: TableIndex | string,
    ): Query {
        const indexName = InstanceChecker.isTableIndex(indexOrName)
            ? indexOrName.name!
            : indexOrName
        return new Query(`DROP INDEX "${indexName}"`)
    }

    /**
     * Builds create column sql.
     */
    protected buildCreateColumnSql(column: TableColumn): string {
        let c = `"${column.name}" ${this.driver.createFullType(column)}`

        if (column.isNullable !== true) {
            c += " NOT NULL"
        }

        if (column.default !== undefined && column.default !== null) {
            c += ` DEFAULT ${column.default}`
        }

        if (
            column.isGenerated === true &&
            column.generationStrategy === "increment"
        ) {
            c += " GENERATED BY DEFAULT AS IDENTITY"
        } else if (
            column.isGenerated === true &&
            column.generationStrategy !== "increment"
        ) {
            // For other generation strategies, we might need custom handling
        }

        return c
    }

    /**
     * Executes up sql queries.
     */
    protected async executeQueries(
        upQueries: Query | Query[],
        downQueries: Query | Query[],
    ): Promise<void> {
        if (!Array.isArray(upQueries)) upQueries = [upQueries]
        if (!Array.isArray(downQueries)) downQueries = [downQueries]

        for (const upQuery of upQueries) {
            await this.query(upQuery.query, upQuery.parameters)
        }
    }
}
