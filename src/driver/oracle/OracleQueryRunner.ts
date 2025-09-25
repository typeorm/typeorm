import { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { ReadStream } from "../../platform/PlatformTools"
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
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { InstanceChecker } from "../../util/InstanceChecker"
import { OrmUtils } from "../../util/OrmUtils"
import { Query } from "../Query"
import { ColumnType } from "../types/ColumnTypes"
import { IsolationLevel } from "../types/IsolationLevel"
import { MetadataTableType } from "../types/MetadataTableType"
import { ReplicationMode } from "../types/ReplicationMode"
import { OracleDriver } from "./OracleDriver"

/**
 * Runs queries on a single oracle database connection.
 */
export class OracleQueryRunner extends BaseQueryRunner implements QueryRunner {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: OracleDriver

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: OracleDriver, mode: ReplicationMode) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
        this.mode = mode
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
            return Promise.resolve(this.databaseConnection)

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver
                .obtainSlaveConnection()
                .then((connection) => {
                    this.databaseConnection = connection
                    return this.databaseConnection
                })
        } else {
            // master
            this.databaseConnectionPromise = this.driver
                .obtainMasterConnection()
                .then((connection) => {
                    this.databaseConnection = connection
                    return this.databaseConnection
                })
        }

        return this.databaseConnectionPromise
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    async release(): Promise<void> {
        this.isReleased = true

        if (!this.databaseConnection) {
            return
        }

        await this.databaseConnection.close()
    }

    /**
     * Starts transaction.
     */
    async startTransaction(
        isolationLevel: IsolationLevel = "READ COMMITTED",
    ): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        // await this.query("START TRANSACTION");
        if (
            isolationLevel !== "SERIALIZABLE" &&
            isolationLevel !== "READ COMMITTED"
        ) {
            throw new TypeORMError(
                `Oracle only supports SERIALIZABLE and READ COMMITTED isolation`,
            )
        }

        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        if (this.transactionDepth === 0) {
            await this.query(
                "SET TRANSACTION ISOLATION LEVEL " + isolationLevel,
            )
        } else {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`)
        }
        this.transactionDepth += 1

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        if (this.transactionDepth === 1) {
            await this.query("COMMIT")
            this.isTransactionActive = false
        }
        this.transactionDepth -= 1

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        if (this.transactionDepth > 1) {
            await this.query(
                `ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`,
            )
        } else {
            await this.query("ROLLBACK")
            this.isTransactionActive = false
        }
        this.transactionDepth -= 1

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

        this.driver.connection.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()
        const queryStartTime = Date.now()

        try {
            const executionOptions = {
                autoCommit: !this.isTransactionActive,
                outFormat: this.driver.oracle.OUT_FORMAT_OBJECT,
            }

            const raw = await databaseConnection.execute(
                query,
                parameters || {},
                executionOptions,
            )

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime

            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                raw,
                undefined,
            )

            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            )
                this.driver.connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )

            const result = new QueryResult()

            result.raw =
                raw.rows ||
                raw.outBinds ||
                raw.rowsAffected ||
                raw.implicitResults

            if (raw?.hasOwnProperty("rows") && Array.isArray(raw.rows)) {
                result.records = raw.rows
            }

            if (
                raw?.hasOwnProperty("outBinds") &&
                Array.isArray(raw.outBinds)
            ) {
                result.records = raw.outBinds
            }

            if (
                raw?.hasOwnProperty("implicitResults") &&
                Array.isArray(raw.implicitResults)
            ) {
                result.records = raw.implicitResults
            }

            if (raw?.hasOwnProperty("rowsAffected")) {
                result.affected = raw.rowsAffected
            }

            if (useStructuredResult) {
                return result
            } else {
                return result.raw
            }
        } catch (err) {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                false,
                undefined,
                undefined,
                err,
            )

            throw new QueryFailedError(query, parameters, err)
        } finally {
            await broadcasterResult.wait()
        }
    }

    /**
     * Returns raw data stream.
     */
    async stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<ReadStream> {
        if (this.isReleased) {
            throw new QueryRunnerAlreadyReleasedError()
        }

        const executionOptions = {
            autoCommit: !this.isTransactionActive,
            outFormat: this.driver.oracle.OUT_FORMAT_OBJECT,
        }

        const databaseConnection = await this.connect()

        this.driver.connection.logger.logQuery(query, parameters, this)

        try {
            const stream = databaseConnection.queryStream(
                query,
                parameters,
                executionOptions,
            )
            if (onEnd) {
                stream.on("end", onEnd)
            }

            if (onError) {
                stream.on("error", onError)
            }

            return stream
        } catch (err) {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
            throw new QueryFailedError(query, parameters, err)
        }
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        return Promise.resolve([])
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([])
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        try {
            const query = await this.query(
                `SELECT 1 AS "exists" FROM global_name@"${database}"`,
            )

            return query.length > 0
        } catch (e) {
            return false
        }
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<undefined> {
        const query = await this.query(
            `SELECT SYS_CONTEXT('USERENV','DB_NAME') AS "db_name" FROM dual`,
        )
        return query[0]["db_name"]
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        return Promise.resolve(false)
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<string> {
        const query = await this.query(
            `SELECT SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS "schema_name" FROM dual`,
        )
        return query[0]["schema_name"]
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const { tableName } = this.driver.parseTableName(tableOrName)
        const sql = `SELECT "TABLE_NAME" FROM "USER_TABLES" WHERE "TABLE_NAME" = '${tableName}'`
        const result = await this.query(sql)
        return result.length ? true : false
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(
        tableOrName: Table | string,
        columnName: string,
    ): Promise<boolean> {
        const { tableName } = this.driver.parseTableName(tableOrName)
        const sql = `SELECT "COLUMN_NAME" FROM "USER_TAB_COLS" WHERE "TABLE_NAME" = '${tableName}' AND "COLUMN_NAME" = '${columnName}'`
        const result = await this.query(sql)
        return result.length ? true : false
    }

    /**
     * Creates a new database.
     */
    async createDatabase(
        database: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        // Even with `IF NOT EXISTS` we get:
        //   ORA-01501: CREATE DATABASE failed
        //   ORA-01100: database already mounted
        if (ifNotExist) {
            try {
                await this.query(`CREATE DATABASE IF NOT EXISTS "${database}";`)
            } catch (e) {
                // if (e instanceof QueryFailedError) {
                if (e.message.includes("ORA-01100: database already mounted")) {
                    return
                }
                // }

                throw e
            }
        } else {
            await this.query(`CREATE DATABASE "${database}"`)
        }
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(
        schemaPath: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema create queries are not supported by Oracle driver.`,
        )
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new TypeORMError(
            `Schema drop queries are not supported by Oracle driver.`,
        )
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
        downQueries.push(this.dropTableSql(table))

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach((foreignKey) =>
                downQueries.push(this.dropForeignKeySql(table, foreignKey)),
            )

        if (createIndices) {
            table.indices.forEach((index) => {
                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(
                        table,
                        index.columnNames,
                        index.where,
                    )
                upQueries.push(this.createIndexSql(table, index))
                downQueries.push(this.dropIndexSql(index))
            })
        }

        // if table have column with generated type, we must add the expression to the metadata table
        const generatedColumns = table.columns.filter(
            (column) => column.generatedType && column.asExpression,
        )

        for (const column of generatedColumns) {
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            upQueries.push(insertQuery)
            downQueries.push(deleteQuery)
        }

        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drops the table.
     */
    async dropTable(
        tableOrName: Table | string,
        ifExist?: boolean,
        dropForeignKeys: boolean = true,
        dropIndices: boolean = true,
    ): Promise<void> {
        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(tableOrName)
            if (!isTableExist) return Promise.resolve()
        }

        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        if (dropIndices) {
            table.indices.forEach((index) => {
                upQueries.push(this.dropIndexSql(index))
                downQueries.push(this.createIndexSql(table, index))
            })
        }

        // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (dropForeignKeys)
            table.foreignKeys.forEach((foreignKey) =>
                upQueries.push(this.dropForeignKeySql(table, foreignKey)),
            )

        upQueries.push(this.dropTableSql(table))
        downQueries.push(this.createTableSql(table, createForeignKeys))

        // if table had columns with generated type, we must remove the expression from the metadata table
        const generatedColumns = table.columns.filter(
            (column) => column.generatedType && column.asExpression,
        )

        for (const column of generatedColumns) {
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            upQueries.push(deleteQuery)
            downQueries.push(insertQuery)
        }

        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Creates a new view.
     */
    async createView(
        view: View,
        syncWithMetadata: boolean = false,
    ): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []
        upQueries.push(this.createViewSql(view))
        if (syncWithMetadata) upQueries.push(this.insertViewDefinitionSql(view))
        downQueries.push(this.dropViewSql(view))
        if (syncWithMetadata)
            downQueries.push(this.deleteViewDefinitionSql(view))
        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drops the view.
     */
    async dropView(target: View | string): Promise<void> {
        const viewName = InstanceChecker.isView(target) ? target.name : target
        const view = await this.getCachedView(viewName)

        const upQueries: Query[] = []
        const downQueries: Query[] = []
        upQueries.push(this.deleteViewDefinitionSql(view))
        upQueries.push(this.dropViewSql(view))
        downQueries.push(this.insertViewDefinitionSql(view))
        downQueries.push(this.createViewSql(view))
        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Renames the given table.
     */
    async renameTable(
        oldTableOrName: Table | string,
        newTableName: string,
    ): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []
        const oldTable = InstanceChecker.isTable(oldTableOrName)
            ? oldTableOrName
            : await this.getCachedTable(oldTableOrName)
        const newTable = oldTable.clone()

        const { database: dbName, tableName: oldTableName } =
            this.driver.parseTableName(oldTable)

        newTable.name = dbName ? `${dbName}.${newTableName}` : newTableName

        // rename table
        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    oldTable,
                )} RENAME TO "${newTableName}"`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    newTable,
                )} RENAME TO "${oldTableName}"`,
            ),
        )

        // rename primary key constraint
        if (
            newTable.primaryColumns.length > 0 &&
            !newTable.primaryColumns[0].primaryKeyConstraintName
        ) {
            const columnNames = newTable.primaryColumns.map(
                (column) => column.name,
            )

            const oldPkName = this.connection.namingStrategy.primaryKeyName(
                oldTable,
                columnNames,
            )
            const newPkName = this.connection.namingStrategy.primaryKeyName(
                newTable,
                columnNames,
            )

            // build queries
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`,
                ),
            )
        }

        // rename unique constraints
        newTable.uniques.forEach((unique) => {
            const oldUniqueName =
                this.connection.namingStrategy.uniqueConstraintName(
                    oldTable,
                    unique.columnNames,
                )

            // Skip renaming if Unique has user defined constraint name
            if (unique.name !== oldUniqueName) return

            // build new constraint name
            const newUniqueName =
                this.connection.namingStrategy.uniqueConstraintName(
                    newTable,
                    unique.columnNames,
                )

            // build queries
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${
                        unique.name
                    }" TO "${newUniqueName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${newUniqueName}" TO "${
                        unique.name
                    }"`,
                ),
            )

            // replace constraint name
            unique.name = newUniqueName
        })

        // rename index constraints
        newTable.indices.forEach((index) => {
            const oldIndexName = this.connection.namingStrategy.indexName(
                oldTable,
                index.columnNames,
                index.where,
            )

            // Skip renaming if Index has user defined constraint name
            if (index.name !== oldIndexName) return

            // build new constraint name
            const newIndexName = this.connection.namingStrategy.indexName(
                newTable,
                index.columnNames,
                index.where,
            )

            // build queries
            upQueries.push(
                new Query(
                    `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`,
                ),
            )

            // replace constraint name
            index.name = newIndexName
        })

        // rename foreign key constraints
        newTable.foreignKeys.forEach((foreignKey) => {
            const oldForeignKeyName =
                this.connection.namingStrategy.foreignKeyName(
                    oldTable,
                    foreignKey.columnNames,
                    this.getTablePath(foreignKey),
                    foreignKey.referencedColumnNames,
                )

            // Skip renaming if foreign key has user defined constraint name
            if (foreignKey.name !== oldForeignKeyName) return

            // build new constraint name
            const newForeignKeyName =
                this.connection.namingStrategy.foreignKeyName(
                    newTable,
                    foreignKey.columnNames,
                    this.getTablePath(foreignKey),
                    foreignKey.referencedColumnNames,
                )

            // build queries
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${
                        foreignKey.name
                    }" TO "${newForeignKeyName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} RENAME CONSTRAINT "${newForeignKeyName}" TO "${
                        foreignKey.name
                    }"`,
                ),
            )

            // replace constraint name
            foreignKey.name = newForeignKeyName
        })

        await this.executeQueries(upQueries, downQueries)

        // rename old table and replace it in cached tabled;
        oldTable.name = newTable.name
        this.replaceCachedTable(oldTable, newTable)
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(
        tableOrName: Table | string,
        column: TableColumn,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD ${this.buildCreateColumnSql(column)}`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${
                    column.name
                }"`,
            ),
        )

        // create or update primary key constraint
        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns
            // if table already have primary key, me must drop it and recreate again
            if (primaryColumns.length > 0) {
                const pkName = primaryColumns[0].primaryKeyConstraintName
                    ? primaryColumns[0].primaryKeyConstraintName
                    : this.connection.namingStrategy.primaryKeyName(
                          clonedTable,
                          primaryColumns.map((column) => column.name),
                      )

                const columnNames = primaryColumns
                    .map((column) => `"${column.name}"`)
                    .join(", ")

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} DROP CONSTRAINT "${pkName}"`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                    ),
                )
            }

            primaryColumns.push(column)
            const pkName = primaryColumns[0].primaryKeyConstraintName
                ? primaryColumns[0].primaryKeyConstraintName
                : this.connection.namingStrategy.primaryKeyName(
                      clonedTable,
                      primaryColumns.map((column) => column.name),
                  )

            const columnNames = primaryColumns
                .map((column) => `"${column.name}"`)
                .join(", ")

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} DROP CONSTRAINT "${pkName}"`,
                ),
            )
        }

        // create column index
        const columnIndex = clonedTable.indices.find(
            (index) =>
                index.columnNames.length === 1 &&
                index.columnNames[0] === column.name,
        )
        if (columnIndex) {
            clonedTable.indices.splice(
                clonedTable.indices.indexOf(columnIndex),
                1,
            )
            upQueries.push(this.createIndexSql(table, columnIndex))
            downQueries.push(this.dropIndexSql(columnIndex))
        }

        // create unique constraint
        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(
                    table,
                    [column.name],
                ),
                columnNames: [column.name],
            })
            clonedTable.uniques.push(uniqueConstraint)
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${
                        uniqueConstraint.name
                    }" UNIQUE ("${column.name}")`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${
                        uniqueConstraint.name
                    }"`,
                ),
            )
        }

        if (column.generatedType && column.asExpression) {
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            upQueries.push(insertQuery)
            downQueries.push(deleteQuery)
        }

        await this.executeQueries(upQueries, downQueries)

        clonedTable.addColumn(column)
        this.replaceCachedTable(table, clonedTable)
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
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const oldColumn = InstanceChecker.isTableColumn(oldTableColumnOrName)
            ? oldTableColumnOrName
            : table.columns.find((c) => c.name === oldTableColumnOrName)
        if (!oldColumn)
            throw new TypeORMError(
                `Column "${oldTableColumnOrName}" was not found in the ${this.escapePath(
                    table,
                )} table.`,
            )

        let newColumn: TableColumn | undefined = undefined
        if (InstanceChecker.isTableColumn(newTableColumnOrName)) {
            newColumn = newTableColumnOrName
        } else {
            newColumn = oldColumn.clone()
            newColumn.name = newTableColumnOrName
        }

        await this.changeColumn(table, oldColumn, newColumn)
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
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        let clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        const oldColumn = InstanceChecker.isTableColumn(oldTableColumnOrName)
            ? oldTableColumnOrName
            : table.columns.find(
                  (column) => column.name === oldTableColumnOrName,
              )
        if (!oldColumn)
            throw new TypeORMError(
                `Column "${oldTableColumnOrName}" was not found in the ${this.escapePath(
                    table,
                )} table.`,
            )

        if (
            (newColumn.isGenerated !== oldColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid") ||
            oldColumn.type !== newColumn.type ||
            oldColumn.generatedType !== newColumn.generatedType ||
            oldColumn.asExpression !== newColumn.asExpression
        ) {
            // Oracle does not support changing of IDENTITY column, so we must drop column and recreate it again.
            // Also, we recreate column if column type changed
            await this.dropColumn(table, oldColumn)
            await this.addColumn(table, newColumn)

            // update cloned table
            clonedTable = table.clone()
        } else {
            if (newColumn.name !== oldColumn.name) {
                // rename column
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} RENAME COLUMN "${
                            oldColumn.name
                        }" TO "${newColumn.name}"`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} RENAME COLUMN "${
                            newColumn.name
                        }" TO "${oldColumn.name}"`,
                    ),
                )

                // rename column primary key constraint
                if (
                    oldColumn.isPrimary === true &&
                    !oldColumn.primaryKeyConstraintName
                ) {
                    const primaryColumns = clonedTable.primaryColumns

                    // build old primary constraint name
                    const columnNames = primaryColumns.map(
                        (column) => column.name,
                    )
                    const oldPkName =
                        this.connection.namingStrategy.primaryKeyName(
                            clonedTable,
                            columnNames,
                        )

                    // replace old column name with new column name
                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1)
                    columnNames.push(newColumn.name)

                    // build new primary constraint name
                    const newPkName =
                        this.connection.namingStrategy.primaryKeyName(
                            clonedTable,
                            columnNames,
                        )

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`,
                        ),
                    )
                }

                // rename unique constraints
                clonedTable.findColumnUniques(oldColumn).forEach((unique) => {
                    const oldUniqueName =
                        this.connection.namingStrategy.uniqueConstraintName(
                            clonedTable,
                            unique.columnNames,
                        )

                    // Skip renaming if Unique has user defined constraint name
                    if (unique.name !== oldUniqueName) return

                    // build new constraint name
                    unique.columnNames.splice(
                        unique.columnNames.indexOf(oldColumn.name),
                        1,
                    )
                    unique.columnNames.push(newColumn.name)
                    const newUniqueName =
                        this.connection.namingStrategy.uniqueConstraintName(
                            clonedTable,
                            unique.columnNames,
                        )

                    // build queries
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} RENAME CONSTRAINT "${
                                unique.name
                            }" TO "${newUniqueName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} RENAME CONSTRAINT "${newUniqueName}" TO "${
                                unique.name
                            }"`,
                        ),
                    )

                    // replace constraint name
                    unique.name = newUniqueName
                })

                // rename index constraints
                clonedTable.findColumnIndices(oldColumn).forEach((index) => {
                    const oldIndexName =
                        this.connection.namingStrategy.indexName(
                            clonedTable,
                            index.columnNames,
                            index.where,
                        )

                    // Skip renaming if Index has user defined constraint name
                    if (index.name !== oldIndexName) return

                    // build new constraint name
                    index.columnNames.splice(
                        index.columnNames.indexOf(oldColumn.name),
                        1,
                    )
                    index.columnNames.push(newColumn.name)
                    const newIndexName =
                        this.connection.namingStrategy.indexName(
                            clonedTable,
                            index.columnNames,
                            index.where,
                        )

                    // build queries
                    upQueries.push(
                        new Query(
                            `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`,
                        ),
                    )

                    // replace constraint name
                    index.name = newIndexName
                })

                // rename foreign key constraints
                clonedTable
                    .findColumnForeignKeys(oldColumn)
                    .forEach((foreignKey) => {
                        const foreignKeyName =
                            this.connection.namingStrategy.foreignKeyName(
                                clonedTable,
                                foreignKey.columnNames,
                                this.getTablePath(foreignKey),
                                foreignKey.referencedColumnNames,
                            )

                        // Skip renaming if foreign key has user defined constraint name
                        if (foreignKey.name !== foreignKeyName) return

                        // build new constraint name
                        foreignKey.columnNames.splice(
                            foreignKey.columnNames.indexOf(oldColumn.name),
                            1,
                        )
                        foreignKey.columnNames.push(newColumn.name)
                        const newForeignKeyName =
                            this.connection.namingStrategy.foreignKeyName(
                                clonedTable,
                                foreignKey.columnNames,
                                this.getTablePath(foreignKey),
                                foreignKey.referencedColumnNames,
                            )

                        // build queries
                        upQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} RENAME CONSTRAINT "${
                                    foreignKey.name
                                }" TO "${newForeignKeyName}"`,
                            ),
                        )
                        downQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} RENAME CONSTRAINT "${newForeignKeyName}" TO "${
                                    foreignKey.name
                                }"`,
                            ),
                        )

                        // replace constraint name
                        foreignKey.name = newForeignKeyName
                    })

                // rename old column in the Table object
                const oldTableColumn = clonedTable.columns.find(
                    (column) => column.name === oldColumn.name,
                )
                clonedTable.columns[
                    clonedTable.columns.indexOf(oldTableColumn!)
                ].name = newColumn.name
                oldColumn.name = newColumn.name
            }

            // BEGIN length-only fast path (Oracle)
            if (
                oldColumn.type === newColumn.type &&
                oldColumn.length !== newColumn.length
            ) {
                const oldLen = oldColumn.length
                    ? parseInt(oldColumn.length, 10)
                    : undefined
                const newLen = newColumn.length
                    ? parseInt(newColumn.length, 10)
                    : undefined
                const col = oldColumn.name

                if (oldLen && newLen && newLen < oldLen) {
                    // shrink: avoid ORA-01441 by truncating first
                    upQueries.push(
                        new Query(
                            `UPDATE ${this.escapePath(table)} ` +
                                `SET "${col}" = SUBSTR("${col}", 1, ${newLen}) ` +
                                `WHERE LENGTH("${col}") > ${newLen}`,
                        ),
                    )
                }

                const nullability = newColumn.isNullable ? "" : " NOT NULL"
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} MODIFY ("${col}" ${this.driver.createFullType(
                            newColumn,
                        )}${nullability})`,
                    ),
                )
                const downNullability = oldColumn.isNullable ? "" : " NOT NULL"
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} MODIFY ("${col}" ${this.driver.createFullType(
                            oldColumn,
                        )}${downNullability})`,
                    ),
                )

                await this.executeQueries(upQueries, downQueries)
                return
            }
            // END length-only fast path

            if (this.isColumnChanged(oldColumn, newColumn, true)) {
                let defaultUp: string = ""
                let defaultDown: string = ""
                let nullableUp: string = ""
                let nullableDown: string = ""

                // changing column default
                if (
                    newColumn.default !== null &&
                    newColumn.default !== undefined
                ) {
                    defaultUp = `DEFAULT ${newColumn.default}`

                    if (
                        oldColumn.default !== null &&
                        oldColumn.default !== undefined
                    ) {
                        defaultDown = `DEFAULT ${oldColumn.default}`
                    } else {
                        defaultDown = "DEFAULT NULL"
                    }
                } else if (
                    oldColumn.default !== null &&
                    oldColumn.default !== undefined
                ) {
                    defaultUp = "DEFAULT NULL"
                    defaultDown = `DEFAULT ${oldColumn.default}`
                }

                // changing column isNullable property
                if (newColumn.isNullable !== oldColumn.isNullable) {
                    if (newColumn.isNullable === true) {
                        nullableUp = "NULL"
                        nullableDown = "NOT NULL"
                    } else {
                        nullableUp = "NOT NULL"
                        nullableDown = "NULL"
                    }
                }

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} MODIFY "${
                            oldColumn.name
                        }" ${this.connection.driver.createFullType(
                            newColumn,
                        )} ${defaultUp} ${nullableUp}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} MODIFY "${
                            oldColumn.name
                        }" ${this.connection.driver.createFullType(
                            oldColumn,
                        )} ${defaultDown} ${nullableDown}`,
                    ),
                )
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const pkName = primaryColumns[0].primaryKeyConstraintName
                        ? primaryColumns[0].primaryKeyConstraintName
                        : this.connection.namingStrategy.primaryKeyName(
                              clonedTable,
                              primaryColumns.map((column) => column.name),
                          )

                    const columnNames = primaryColumns
                        .map((column) => `"${column.name}"`)
                        .join(", ")

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${pkName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                        ),
                    )
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn)
                    // update column in table
                    const column = clonedTable.columns.find(
                        (column) => column.name === newColumn.name,
                    )
                    column!.isPrimary = true
                    const pkName = primaryColumns[0].primaryKeyConstraintName
                        ? primaryColumns[0].primaryKeyConstraintName
                        : this.connection.namingStrategy.primaryKeyName(
                              clonedTable,
                              primaryColumns.map((column) => column.name),
                          )

                    const columnNames = primaryColumns
                        .map((column) => `"${column.name}"`)
                        .join(", ")

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${pkName}"`,
                        ),
                    )
                } else {
                    const primaryColumn = primaryColumns.find(
                        (c) => c.name === newColumn.name,
                    )
                    primaryColumns.splice(
                        primaryColumns.indexOf(primaryColumn!),
                        1,
                    )

                    // update column in table
                    const column = clonedTable.columns.find(
                        (column) => column.name === newColumn.name,
                    )
                    column!.isPrimary = false

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = primaryColumns[0]
                            .primaryKeyConstraintName
                            ? primaryColumns[0].primaryKeyConstraintName
                            : this.connection.namingStrategy.primaryKeyName(
                                  clonedTable,
                                  primaryColumns.map((column) => column.name),
                              )

                        const columnNames = primaryColumns
                            .map((column) => `"${column.name}"`)
                            .join(", ")

                        upQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                            ),
                        )
                        downQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} DROP CONSTRAINT "${pkName}"`,
                            ),
                        )
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(
                            table,
                            [newColumn.name],
                        ),
                        columnNames: [newColumn.name],
                    })
                    clonedTable.uniques.push(uniqueConstraint)
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${
                                uniqueConstraint.name
                            }" UNIQUE ("${newColumn.name}")`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${uniqueConstraint.name}"`,
                        ),
                    )
                } else {
                    const uniqueConstraint = clonedTable.uniques.find(
                        (unique) => {
                            return (
                                unique.columnNames.length === 1 &&
                                !!unique.columnNames.find(
                                    (columnName) =>
                                        columnName === newColumn.name,
                                )
                            )
                        },
                    )
                    clonedTable.uniques.splice(
                        clonedTable.uniques.indexOf(uniqueConstraint!),
                        1,
                    )
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${uniqueConstraint!.name}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${
                                uniqueConstraint!.name
                            }" UNIQUE ("${newColumn.name}")`,
                        ),
                    )
                }
            }

            await this.executeQueries(upQueries, downQueries)
            this.replaceCachedTable(table, clonedTable)
        }
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
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const column = InstanceChecker.isTableColumn(columnOrName)
            ? columnOrName
            : table.findColumnByName(columnOrName)
        if (!column)
            throw new TypeORMError(
                `Column "${columnOrName}" was not found in table ${this.escapePath(
                    table,
                )}`,
            )

        const clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        // drop primary key constraint
        if (column.isPrimary) {
            const pkName = column.primaryKeyConstraintName
                ? column.primaryKeyConstraintName
                : this.connection.namingStrategy.primaryKeyName(
                      clonedTable,
                      clonedTable.primaryColumns.map((column) => column.name),
                  )

            const columnNames = clonedTable.primaryColumns
                .map((primaryColumn) => `"${primaryColumn.name}"`)
                .join(", ")

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        clonedTable,
                    )} DROP CONSTRAINT "${pkName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        clonedTable,
                    )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                ),
            )

            // update column in table
            const tableColumn = clonedTable.findColumnByName(column.name)
            tableColumn!.isPrimary = false

            // if primary key have multiple columns, we must recreate it without dropped column
            if (clonedTable.primaryColumns.length > 0) {
                const pkName = clonedTable.primaryColumns[0]
                    .primaryKeyConstraintName
                    ? clonedTable.primaryColumns[0].primaryKeyConstraintName
                    : this.connection.namingStrategy.primaryKeyName(
                          clonedTable,
                          clonedTable.primaryColumns.map(
                              (column) => column.name,
                          ),
                      )

                const columnNames = clonedTable.primaryColumns
                    .map((primaryColumn) => `"${primaryColumn.name}"`)
                    .join(", ")

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            clonedTable,
                        )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            clonedTable,
                        )} DROP CONSTRAINT "${pkName}"`,
                    ),
                )
            }
        }

        // drop column index
        const columnIndex = clonedTable.indices.find(
            (index) =>
                index.columnNames.length === 1 &&
                index.columnNames[0] === column.name,
        )
        if (columnIndex) {
            upQueries.push(this.dropIndexSql(columnIndex))
            downQueries.push(this.createIndexSql(table, columnIndex))
        }

        // drop column check
        const columnCheck = clonedTable.checks.find(
            (check) =>
                !!check.columnNames &&
                check.columnNames.length === 1 &&
                check.columnNames[0] === column.name,
        )
        if (columnCheck) {
            clonedTable.checks.splice(
                clonedTable.checks.indexOf(columnCheck),
                1,
            )
            upQueries.push(this.dropCheckConstraintSql(table, columnCheck))
            downQueries.push(this.createCheckConstraintSql(table, columnCheck))
        }

        // drop column unique
        const columnUnique = clonedTable.uniques.find(
            (unique) =>
                unique.columnNames.length === 1 &&
                unique.columnNames[0] === column.name,
        )
        if (columnUnique) {
            clonedTable.uniques.splice(
                clonedTable.uniques.indexOf(columnUnique),
                1,
            )
            upQueries.push(this.dropUniqueConstraintSql(table, columnUnique))
            downQueries.push(
                this.createUniqueConstraintSql(table, columnUnique),
            )
        }

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${
                    column.name
                }"`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD ${this.buildCreateColumnSql(column)}`,
            ),
        )

        if (column.generatedType && column.asExpression) {
            const deleteQuery = this.deleteTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })
            const insertQuery = this.insertTypeormMetadataSql({
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            upQueries.push(deleteQuery)
            downQueries.push(insertQuery)
        }

        await this.executeQueries(upQueries, downQueries)

        clonedTable.removeColumn(column)
        this.replaceCachedTable(table, clonedTable)
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(
        tableOrName: Table | string,
        columns: TableColumn[] | string[],
    ): Promise<void> {
        for (const column of [...columns]) {
            await this.dropColumn(tableOrName, column)
        }
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(
        tableOrName: Table | string,
        columnNames: string[],
        constraintName?: string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const clonedTable = table.clone()

        const up = this.createPrimaryKeySql(table, columnNames, constraintName)

        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
        clonedTable.columns.forEach((column) => {
            if (columnNames.find((columnName) => columnName === column.name))
                column.isPrimary = true
        })
        const down = this.dropPrimaryKeySql(clonedTable)

        await this.executeQueries(up, down)
        this.replaceCachedTable(table, clonedTable)
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const columnNames = columns.map((column) => column.name)
        const clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        // if table already have primary columns, we must drop them.
        const primaryColumns = clonedTable.primaryColumns
        if (primaryColumns.length > 0) {
            const pkName = primaryColumns[0].primaryKeyConstraintName
                ? primaryColumns[0].primaryKeyConstraintName
                : this.connection.namingStrategy.primaryKeyName(
                      clonedTable,
                      primaryColumns.map((column) => column.name),
                  )

            const columnNamesString = primaryColumns
                .map((column) => `"${column.name}"`)
                .join(", ")

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} DROP CONSTRAINT "${pkName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`,
                ),
            )
        }

        // update columns in table.
        clonedTable.columns
            .filter((column) => columnNames.indexOf(column.name) !== -1)
            .forEach((column) => (column.isPrimary = true))

        const pkName = primaryColumns[0].primaryKeyConstraintName
            ? primaryColumns[0].primaryKeyConstraintName
            : this.connection.namingStrategy.primaryKeyName(
                  clonedTable,
                  columnNames,
              )

        const columnNamesString = columnNames
            .map((columnName) => `"${columnName}"`)
            .join(", ")
        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} DROP CONSTRAINT "${pkName}"`,
            ),
        )

        await this.executeQueries(upQueries, downQueries)
        this.replaceCachedTable(table, clonedTable)
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(
        tableOrName: Table | string,
        constraintName?: string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const up = this.dropPrimaryKeySql(table)
        const down = this.createPrimaryKeySql(
            table,
            table.primaryColumns.map((column) => column.name),
            constraintName,
        )
        await this.executeQueries(up, down)
        table.primaryColumns.forEach((column) => {
            column.isPrimary = false
        })
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(
        tableOrName: Table | string,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name =
                this.connection.namingStrategy.uniqueConstraintName(
                    table,
                    uniqueConstraint.columnNames,
                )

        const up = this.createUniqueConstraintSql(table, uniqueConstraint)
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint)
        await this.executeQueries(up, down)
        table.addUniqueConstraint(uniqueConstraint)
    }

    /**
     * Creates a new unique constraints.
     */
    async createUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        const promises = uniqueConstraints.map((uniqueConstraint) =>
            this.createUniqueConstraint(tableOrName, uniqueConstraint),
        )
        await Promise.all(promises)
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const uniqueConstraint = InstanceChecker.isTableUnique(uniqueOrName)
            ? uniqueOrName
            : table.uniques.find((u) => u.name === uniqueOrName)
        if (!uniqueConstraint)
            throw new TypeORMError(
                `Supplied unique constraint was not found in table ${table.name}`,
            )

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint)
        const down = this.createUniqueConstraintSql(table, uniqueConstraint)
        await this.executeQueries(up, down)
        table.removeUniqueConstraint(uniqueConstraint)
    }

    /**
     * Creates an unique constraints.
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        const promises = uniqueConstraints.map((uniqueConstraint) =>
            this.dropUniqueConstraint(tableOrName, uniqueConstraint),
        )
        await Promise.all(promises)
    }

    /**
     * Creates new check constraint.
     */
    async createCheckConstraint(
        tableOrName: Table | string,
        checkConstraint: TableCheck,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!checkConstraint.name)
            checkConstraint.name =
                this.connection.namingStrategy.checkConstraintName(
                    table,
                    checkConstraint.expression!,
                )

        const up = this.createCheckConstraintSql(table, checkConstraint)
        const down = this.dropCheckConstraintSql(table, checkConstraint)
        await this.executeQueries(up, down)
        table.addCheckConstraint(checkConstraint)
    }

    /**
     * Creates new check constraints.
     */
    async createCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        const promises = checkConstraints.map((checkConstraint) =>
            this.createCheckConstraint(tableOrName, checkConstraint),
        )
        await Promise.all(promises)
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(
        tableOrName: Table | string,
        checkOrName: TableCheck | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const checkConstraint = InstanceChecker.isTableCheck(checkOrName)
            ? checkOrName
            : table.checks.find((c) => c.name === checkOrName)
        if (!checkConstraint)
            throw new TypeORMError(
                `Supplied check constraint was not found in table ${table.name}`,
            )

        const up = this.dropCheckConstraintSql(table, checkConstraint)
        const down = this.createCheckConstraintSql(table, checkConstraint)
        await this.executeQueries(up, down)
        table.removeCheckConstraint(checkConstraint)
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        const promises = checkConstraints.map((checkConstraint) =>
            this.dropCheckConstraint(tableOrName, checkConstraint),
        )
        await Promise.all(promises)
    }

    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint(
        tableOrName: Table | string,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        throw new TypeORMError(`Oracle does not support exclusion constraints.`)
    }

    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(`Oracle does not support exclusion constraints.`)
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(
        tableOrName: Table | string,
        exclusionOrName: TableExclusion | string,
    ): Promise<void> {
        throw new TypeORMError(`Oracle does not support exclusion constraints.`)
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(`Oracle does not support exclusion constraints.`)
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(
        tableOrName: Table | string,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(
                table,
                foreignKey.columnNames,
                this.getTablePath(foreignKey),
                foreignKey.referencedColumnNames,
            )

        const up = this.createForeignKeySql(table, foreignKey)
        const down = this.dropForeignKeySql(table, foreignKey)
        await this.executeQueries(up, down)
        table.addForeignKey(foreignKey)
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        const promises = foreignKeys.map((foreignKey) =>
            this.createForeignKey(tableOrName, foreignKey),
        )
        await Promise.all(promises)
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(
        tableOrName: Table | string,
        foreignKeyOrName: TableForeignKey | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const foreignKey = InstanceChecker.isTableForeignKey(foreignKeyOrName)
            ? foreignKeyOrName
            : table.foreignKeys.find((fk) => fk.name === foreignKeyOrName)
        if (!foreignKey)
            throw new TypeORMError(
                `Supplied foreign key was not found in table ${table.name}`,
            )

        const up = this.dropForeignKeySql(table, foreignKey)
        const down = this.createForeignKeySql(table, foreignKey)
        await this.executeQueries(up, down)
        table.removeForeignKey(foreignKey)
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        const promises = foreignKeys.map((foreignKey) =>
            this.dropForeignKey(tableOrName, foreignKey),
        )
        await Promise.all(promises)
    }

    /**
     * Creates a new index.
     */
    async createIndex(
        tableOrName: Table | string,
        index: TableIndex,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name) index.name = this.generateIndexName(table, index)

        const up = this.createIndexSql(table, index)
        const down = this.dropIndexSql(index)
        await this.executeQueries(up, down)
        table.addIndex(index)
    }

    /**
     * Creates a new indices
     */
    async createIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
    ): Promise<void> {
        const promises = indices.map((index) =>
            this.createIndex(tableOrName, index),
        )
        await Promise.all(promises)
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(
        tableOrName: Table | string,
        indexOrName: TableIndex | string,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const index = InstanceChecker.isTableIndex(indexOrName)
            ? indexOrName
            : table.indices.find((i) => i.name === indexOrName)
        if (!index)
            throw new TypeORMError(
                `Supplied index ${indexOrName} was not found in table ${table.name}`,
            )
        // old index may be passed without name. In this case we generate index name manually.
        if (!index.name) index.name = this.generateIndexName(table, index)

        const up = this.dropIndexSql(index)
        const down = this.createIndexSql(table, index)
        await this.executeQueries(up, down)
        table.removeIndex(index)
    }

    /**
     * Drops an indices from the table.
     */
    async dropIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
    ): Promise<void> {
        const promises = indices.map((index) =>
            this.dropIndex(tableOrName, index),
        )
        await Promise.all(promises)
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapePath(tableName)}`)
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        const isAnotherTransactionActive = this.isTransactionActive
        if (!isAnotherTransactionActive) await this.startTransaction()
        try {
            // drop views
            const dropViewsQuery = `SELECT 'DROP VIEW "' || VIEW_NAME || '"' AS "query" FROM "USER_VIEWS"`
            const dropViewQueries: ObjectLiteral[] = await this.query(
                dropViewsQuery,
            )
            await Promise.all(
                dropViewQueries.map((query) => this.query(query["query"])),
            )

            // drop materialized views
            const dropMatViewsQuery = `SELECT 'DROP MATERIALIZED VIEW "' || MVIEW_NAME || '"' AS "query" FROM "USER_MVIEWS"`
            const dropMatViewQueries: ObjectLiteral[] = await this.query(
                dropMatViewsQuery,
            )
            await Promise.all(
                dropMatViewQueries.map((query) => this.query(query["query"])),
            )

            // drop tables
            const dropTablesQuery = `SELECT 'DROP TABLE "' || TABLE_NAME || '" CASCADE CONSTRAINTS' AS "query" FROM "USER_TABLES"`
            const dropTableQueries: ObjectLiteral[] = await this.query(
                dropTablesQuery,
            )
            await Promise.all(
                dropTableQueries.map((query) => this.query(query["query"])),
            )
            if (!isAnotherTransactionActive) await this.commitTransaction()
        } catch (error) {
            try {
                // we throw original error even if rollback thrown an error
                if (!isAnotherTransactionActive)
                    await this.rollbackTransaction()
            } catch (rollbackError) {}
            throw error
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async loadViews(viewNames?: string[]): Promise<View[]> {
        const hasTable = await this.hasTable(this.getTypeormMetadataTableName())
        if (!hasTable) {
            return []
        }

        if (!viewNames) {
            viewNames = []
        }

        const currentDatabase = await this.getCurrentDatabase()
        const currentSchema = await this.getCurrentSchema()

        const viewsCondition = viewNames
            .map((viewName) => this.driver.parseTableName(viewName))
            .map(({ schema, tableName }) => {
                if (!schema) {
                    schema = this.driver.options.schema || currentSchema
                }

                return `("T"."schema" = '${schema}' AND "T"."name" = '${tableName}')`
            })
            .join(" OR ")

        let query =
            `SELECT "T".* FROM ${this.escapePath(
                this.getTypeormMetadataTableName(),
            )} "T" ` +
            `INNER JOIN "USER_OBJECTS" "O" ON "O"."OBJECT_NAME" = "T"."name" AND "O"."OBJECT_TYPE" IN ( 'MATERIALIZED VIEW', 'VIEW' ) ` +
            `WHERE "T"."type" IN ('${MetadataTableType.MATERIALIZED_VIEW}', '${MetadataTableType.VIEW}')`
        if (viewsCondition.length > 0) query += ` AND ${viewsCondition}`

        const dbViews = await this.query(query)
        return dbViews.map((dbView: any) => {
            const parsedName = this.driver.parseTableName(dbView["name"])

            const view = new View()
            view.database =
                parsedName.database || dbView["database"] || currentDatabase
            view.schema = parsedName.schema || dbView["schema"] || currentSchema
            view.name = parsedName.tableName
            view.expression = dbView["value"]
            view.materialized =
                dbView["type"] === MetadataTableType.MATERIALIZED_VIEW
            return view
        })
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        if (tableNames && tableNames.length === 0) {
            return []
        }

        const dbTables: { TABLE_NAME: string; OWNER: string }[] = []

        const currentSchema = await this.getCurrentSchema()
        const currentDatabase = await this.getCurrentDatabase()

        if (!tableNames) {
            const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES"`
            dbTables.push(...(await this.query(tablesSql)))
        } else {
            const tablesCondition = tableNames
                .map((tableName) => {
                    const parts = tableName.split(".")

                    if (parts.length >= 3) {
                        const [, schema, name] = parts
                        return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
                    } else if (parts.length === 2) {
                        const [schema, name] = parts
                        return `("OWNER" = '${schema}' AND "TABLE_NAME" = '${name}')`
                    } else if (parts.length === 1) {
                        const [name] = parts
                        return `("TABLE_NAME" = '${name}')`
                    } else {
                        return `(1=0)`
                    }
                })
                .join(" OR ")
            const tablesSql = `SELECT "TABLE_NAME", "OWNER" FROM "ALL_TABLES" WHERE ${tablesCondition}`
            dbTables.push(...(await this.query(tablesSql)))
        }

        // if tables were not found in the db, no need to proceed
        if (dbTables.length === 0) {
            return []
        }

        // load tables, columns, indices and foreign keys
        const columnsCondition = dbTables
            .map(({ TABLE_NAME, OWNER }) => {
                return `("C"."OWNER" = '${OWNER}' AND "C"."TABLE_NAME" = '${TABLE_NAME}')`
            })
            .join(" OR ")
        const columnsSql = `SELECT * FROM "ALL_TAB_COLS" "C" WHERE (${columnsCondition})`

        const indicesSql =
            `SELECT "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS", ` +
            `LISTAGG ("COL"."COLUMN_NAME", ',') WITHIN GROUP (ORDER BY "COL"."COLUMN_NAME") AS "COLUMN_NAMES" ` +
            `FROM "ALL_INDEXES" "C" ` +
            `INNER JOIN "ALL_IND_COLUMNS" "COL" ON "COL"."INDEX_OWNER" = "C"."OWNER" AND "COL"."INDEX_NAME" = "C"."INDEX_NAME" ` +
            `LEFT JOIN "ALL_CONSTRAINTS" "CON" ON "CON"."OWNER" = "C"."OWNER" AND "CON"."CONSTRAINT_NAME" = "C"."INDEX_NAME" ` +
            `WHERE (${columnsCondition}) AND "CON"."CONSTRAINT_NAME" IS NULL ` +
            `GROUP BY "C"."INDEX_NAME", "C"."OWNER", "C"."TABLE_NAME", "C"."UNIQUENESS"`

        const foreignKeysSql =
            `SELECT "C"."CONSTRAINT_NAME", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "REF_COL"."TABLE_NAME" AS "REFERENCED_TABLE_NAME", ` +
            `"REF_COL"."COLUMN_NAME" AS "REFERENCED_COLUMN_NAME", "C"."DELETE_RULE" AS "ON_DELETE" ` +
            `FROM "ALL_CONSTRAINTS" "C" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "REF_COL" ON "REF_COL"."OWNER" = "C"."R_OWNER" AND "REF_COL"."CONSTRAINT_NAME" = "C"."R_CONSTRAINT_NAME" AND "REF_COL"."POSITION" = "COL"."POSITION" ` +
            `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" = 'R'`

        const constraintsSql =
            `SELECT "C"."CONSTRAINT_NAME", "C"."CONSTRAINT_TYPE", "C"."OWNER", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "C"."SEARCH_CONDITION" ` +
            `FROM "ALL_CONSTRAINTS" "C" ` +
            `INNER JOIN "ALL_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `WHERE (${columnsCondition}) AND "C"."CONSTRAINT_TYPE" IN ('C', 'U', 'P') AND "C"."GENERATED" = 'USER NAME'`

        const [
            dbColumns,
            dbIndices,
            dbForeignKeys,
            dbConstraints,
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
            this.query(constraintsSql),
        ])

        // create tables for loaded tables
        return await Promise.all(
            dbTables.map(async (dbTable) => {
                const table = new Table()
                const owner =
                    dbTable["OWNER"] === currentSchema &&
                    (!this.driver.options.schema ||
                        this.driver.options.schema === currentSchema)
                        ? undefined
                        : dbTable["OWNER"]
                table.database = currentDatabase
                table.schema = dbTable["OWNER"]
                table.name = this.driver.buildTableName(
                    dbTable["TABLE_NAME"],
                    owner,
                )

                // create columns from the loaded columns
                table.columns = await Promise.all(
                    dbColumns
                        .filter(
                            (dbColumn) =>
                                dbColumn["OWNER"] === dbTable["OWNER"] &&
                                dbColumn["TABLE_NAME"] ===
                                    dbTable["TABLE_NAME"] &&
                                // Filter out auto-generated virtual columns,
                                // since TypeORM will have no info about them.
                                !(
                                    dbColumn["VIRTUAL_COLUMN"] === "YES" &&
                                    dbColumn["USER_GENERATED"] === "NO"
                                ),
                        )
                        .map(async (dbColumn) => {
                            const columnConstraints = dbConstraints.filter(
                                (dbConstraint) =>
                                    dbConstraint["OWNER"] ===
                                        dbColumn["OWNER"] &&
                                    dbConstraint["TABLE_NAME"] ===
                                        dbColumn["TABLE_NAME"] &&
                                    dbConstraint["COLUMN_NAME"] ===
                                        dbColumn["COLUMN_NAME"],
                            )

                            const uniqueConstraints = columnConstraints.filter(
                                (constraint) =>
                                    constraint["CONSTRAINT_TYPE"] === "U",
                            )
                            const isConstraintComposite =
                                uniqueConstraints.every((uniqueConstraint) => {
                                    return dbConstraints.some(
                                        (dbConstraint) =>
                                            dbConstraint["OWNER"] ===
                                                dbColumn["OWNER"] &&
                                            dbConstraint["TABLE_NAME"] ===
                                                dbColumn["TABLE_NAME"] &&
                                            dbConstraint["COLUMN_NAME"] !==
                                                dbColumn["COLUMN_NAME"] &&
                                            dbConstraint["CONSTRAINT_NAME"] ===
                                                uniqueConstraint[
                                                    "CONSTRAINT_NAME"
                                                ] &&
                                            dbConstraint["CONSTRAINT_TYPE"] ===
                                                "U",
                                    )
                                })

                            const tableColumn = new TableColumn()
                            tableColumn.name = dbColumn["COLUMN_NAME"]
                            tableColumn.type =
                                dbColumn["DATA_TYPE"].toLowerCase()
                            if (tableColumn.type.indexOf("(") !== -1)
                                tableColumn.type = tableColumn.type.replace(
                                    /\([0-9]*\)/,
                                    "",
                                )

                            // check only columns that have length property
                            if (
                                this.driver.withLengthColumnTypes.indexOf(
                                    tableColumn.type as ColumnType,
                                ) !== -1
                            ) {
                                const length =
                                    tableColumn.type === "raw"
                                        ? dbColumn["DATA_LENGTH"]
                                        : dbColumn["CHAR_COL_DECL_LENGTH"]
                                tableColumn.length =
                                    length &&
                                    !this.isDefaultColumnLength(
                                        table,
                                        tableColumn,
                                        length,
                                    )
                                        ? length.toString()
                                        : ""
                            }

                            if (
                                tableColumn.type === "number" ||
                                tableColumn.type === "float"
                            ) {
                                if (
                                    dbColumn["DATA_PRECISION"] !== null &&
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["DATA_PRECISION"],
                                    )
                                )
                                    tableColumn.precision =
                                        dbColumn["DATA_PRECISION"]
                                if (
                                    dbColumn["DATA_SCALE"] !== null &&
                                    !this.isDefaultColumnScale(
                                        table,
                                        tableColumn,
                                        dbColumn["DATA_SCALE"],
                                    )
                                )
                                    tableColumn.scale = dbColumn["DATA_SCALE"]
                            } else if (
                                (tableColumn.type === "timestamp" ||
                                    tableColumn.type ===
                                        "timestamp with time zone" ||
                                    tableColumn.type ===
                                        "timestamp with local time zone") &&
                                dbColumn["DATA_SCALE"] !== null
                            ) {
                                tableColumn.precision =
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["DATA_SCALE"],
                                    )
                                        ? dbColumn["DATA_SCALE"]
                                        : undefined
                            }

                            tableColumn.default =
                                dbColumn["DATA_DEFAULT"] !== null &&
                                dbColumn["DATA_DEFAULT"] !== undefined &&
                                dbColumn["VIRTUAL_COLUMN"] === "NO" &&
                                dbColumn["DATA_DEFAULT"].trim() !== "NULL"
                                    ? (tableColumn.default =
                                          dbColumn["DATA_DEFAULT"].trim())
                                    : undefined

                            const primaryConstraint = columnConstraints.find(
                                (constraint) =>
                                    constraint["CONSTRAINT_TYPE"] === "P",
                            )
                            if (primaryConstraint) {
                                tableColumn.isPrimary = true
                                // find another columns involved in primary key constraint
                                const anotherPrimaryConstraints =
                                    dbConstraints.filter(
                                        (constraint) =>
                                            constraint["OWNER"] ===
                                                dbColumn["OWNER"] &&
                                            constraint["TABLE_NAME"] ===
                                                dbColumn["TABLE_NAME"] &&
                                            constraint["COLUMN_NAME"] !==
                                                dbColumn["COLUMN_NAME"] &&
                                            constraint["CONSTRAINT_TYPE"] ===
                                                "P",
                                    )

                                // collect all column names
                                const columnNames =
                                    anotherPrimaryConstraints.map(
                                        (constraint) =>
                                            constraint["COLUMN_NAME"],
                                    )
                                columnNames.push(dbColumn["COLUMN_NAME"])

                                // build default primary key constraint name
                                const pkName =
                                    this.connection.namingStrategy.primaryKeyName(
                                        table,
                                        columnNames,
                                    )

                                // if primary key has user-defined constraint name, write it in table column
                                if (
                                    primaryConstraint["CONSTRAINT_NAME"] !==
                                    pkName
                                ) {
                                    tableColumn.primaryKeyConstraintName =
                                        primaryConstraint["CONSTRAINT_NAME"]
                                }
                            }

                            tableColumn.isNullable =
                                dbColumn["NULLABLE"] === "Y"
                            tableColumn.isUnique =
                                uniqueConstraints.length > 0 &&
                                !isConstraintComposite
                            tableColumn.isGenerated =
                                dbColumn["IDENTITY_COLUMN"] === "YES"
                            if (tableColumn.isGenerated) {
                                tableColumn.generationStrategy = "increment"
                                tableColumn.default = undefined
                            }
                            tableColumn.comment = "" // todo

                            if (dbColumn["VIRTUAL_COLUMN"] === "YES") {
                                tableColumn.generatedType = "VIRTUAL"

                                const asExpressionQuery =
                                    this.selectTypeormMetadataSql({
                                        table: dbTable["TABLE_NAME"],
                                        type: MetadataTableType.GENERATED_COLUMN,
                                        name: tableColumn.name,
                                    })

                                const results = await this.query(
                                    asExpressionQuery.query,
                                    asExpressionQuery.parameters,
                                )
                                if (results[0] && results[0].value) {
                                    tableColumn.asExpression = results[0].value
                                } else {
                                    tableColumn.asExpression = ""
                                }
                            }

                            return tableColumn
                        }),
                )

                // find unique constraints of table, group them by constraint name and build TableUnique.
                const tableUniqueConstraints = OrmUtils.uniq(
                    dbConstraints.filter((dbConstraint) => {
                        return (
                            dbConstraint["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbConstraint["OWNER"] === dbTable["OWNER"] &&
                            dbConstraint["CONSTRAINT_TYPE"] === "U"
                        )
                    }),
                    (dbConstraint) => dbConstraint["CONSTRAINT_NAME"],
                )

                table.uniques = tableUniqueConstraints.map((constraint) => {
                    const uniques = dbConstraints.filter(
                        (dbC) =>
                            dbC["CONSTRAINT_NAME"] ===
                            constraint["CONSTRAINT_NAME"],
                    )
                    return new TableUnique({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: uniques.map((u) => u["COLUMN_NAME"]),
                    })
                })

                // find check constraints of table, group them by constraint name and build TableCheck.
                const tableCheckConstraints = OrmUtils.uniq(
                    dbConstraints.filter((dbConstraint) => {
                        return (
                            dbConstraint["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbConstraint["OWNER"] === dbTable["OWNER"] &&
                            dbConstraint["CONSTRAINT_TYPE"] === "C"
                        )
                    }),
                    (dbConstraint) => dbConstraint["CONSTRAINT_NAME"],
                )

                table.checks = tableCheckConstraints.map((constraint) => {
                    const checks = dbConstraints.filter(
                        (dbC) =>
                            dbC["TABLE_NAME"] === constraint["TABLE_NAME"] &&
                            dbC["OWNER"] === constraint["OWNER"] &&
                            dbC["CONSTRAINT_NAME"] ===
                                constraint["CONSTRAINT_NAME"],
                    )
                    return new TableCheck({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: checks.map((c) => c["COLUMN_NAME"]),
                        expression: constraint["SEARCH_CONDITION"],
                    })
                })

                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils.uniq(
                    dbForeignKeys.filter(
                        (dbForeignKey) =>
                            dbForeignKey["OWNER"] === dbTable["OWNER"] &&
                            dbForeignKey["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"],
                    ),
                    (dbForeignKey) => dbForeignKey["CONSTRAINT_NAME"],
                )

                table.foreignKeys = tableForeignKeyConstraints.map(
                    (dbForeignKey) => {
                        const foreignKeys = dbForeignKeys.filter(
                            (dbFk) =>
                                dbFk["TABLE_NAME"] ===
                                    dbForeignKey["TABLE_NAME"] &&
                                dbFk["OWNER"] === dbForeignKey["OWNER"] &&
                                dbFk["CONSTRAINT_NAME"] ===
                                    dbForeignKey["CONSTRAINT_NAME"],
                        )
                        return new TableForeignKey({
                            name: dbForeignKey["CONSTRAINT_NAME"],
                            columnNames: foreignKeys.map(
                                (dbFk) => dbFk["COLUMN_NAME"],
                            ),
                            referencedDatabase: table.database,
                            referencedSchema: dbForeignKey["OWNER"],
                            referencedTableName:
                                dbForeignKey["REFERENCED_TABLE_NAME"],
                            referencedColumnNames: foreignKeys.map(
                                (dbFk) => dbFk["REFERENCED_COLUMN_NAME"],
                            ),
                            onDelete: dbForeignKey["ON_DELETE"],
                            onUpdate: "NO ACTION", // Oracle does not have onUpdate option in FK's, but we need it for proper synchronization
                        })
                    },
                )

                // Attempt to map auto-generated virtual columns to their
                // referenced columns, through its 'DATA_DEFAULT' property.
                //
                // An example of this happening is when a column of type
                // TIMESTAMP WITH TIME ZONE is indexed. Oracle will create a
                // virtual column of type TIMESTAMP with a default value of
                // SYS_EXTRACT_UTC(<column>).
                const autoGenVirtualDbColumns = dbColumns
                    .filter(
                        (dbColumn) =>
                            dbColumn["OWNER"] === dbTable["OWNER"] &&
                            dbColumn["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                            dbColumn["VIRTUAL_COLUMN"] === "YES" &&
                            dbColumn["USER_GENERATED"] === "NO",
                    )
                    .reduce((acc, x) => {
                        const referencedDbColumn = dbColumns.find((dbColumn) =>
                            x["DATA_DEFAULT"].includes(dbColumn["COLUMN_NAME"]),
                        )

                        if (!referencedDbColumn) return acc

                        return {
                            ...acc,
                            [x["COLUMN_NAME"]]:
                                referencedDbColumn["COLUMN_NAME"],
                        }
                    }, {})

                // create TableIndex objects from the loaded indices
                table.indices = dbIndices
                    .filter(
                        (dbIndex) =>
                            dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                            dbIndex["OWNER"] === dbTable["OWNER"],
                    )
                    .map((dbIndex) => {
                        //
                        const columnNames = dbIndex["COLUMN_NAMES"]
                            .split(",")
                            .map(
                                (
                                    columnName: keyof typeof autoGenVirtualDbColumns,
                                ) =>
                                    autoGenVirtualDbColumns[columnName] ??
                                    columnName,
                            )

                        return new TableIndex({
                            name: dbIndex["INDEX_NAME"],
                            columnNames,
                            isUnique: dbIndex["UNIQUENESS"] === "UNIQUE",
                        })
                    })

                return table
            }),
        )
    }

    /**
     * Builds and returns SQL for create table.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const columnDefinitions = table.columns
            .map((column) => this.buildCreateColumnSql(column))
            .join(", ")
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`

        table.columns
            .filter((column) => column.isUnique)
            .forEach((column) => {
                const isUniqueExist = table.uniques.some(
                    (unique) =>
                        unique.columnNames.length === 1 &&
                        unique.columnNames[0] === column.name,
                )
                if (!isUniqueExist)
                    table.uniques.push(
                        new TableUnique({
                            name: this.connection.namingStrategy.uniqueConstraintName(
                                table,
                                [column.name],
                            ),
                            columnNames: [column.name],
                        }),
                    )
            })

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques
                .map((unique) => {
                    const uniqueName = unique.name
                        ? unique.name
                        : this.connection.namingStrategy.uniqueConstraintName(
                              table,
                              unique.columnNames,
                          )
                    const columnNames = unique.columnNames
                        .map((columnName) => `"${columnName}"`)
                        .join(", ")
                    return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`
                })
                .join(", ")

            sql += `, ${uniquesSql}`
        }

        if (table.checks.length > 0) {
            const checksSql = table.checks
                .map((check) => {
                    const checkName = check.name
                        ? check.name
                        : this.connection.namingStrategy.checkConstraintName(
                              table,
                              check.expression!,
                          )
                    return `CONSTRAINT "${checkName}" CHECK (${check.expression})`
                })
                .join(", ")

            sql += `, ${checksSql}`
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys
                .map((fk) => {
                    const columnNames = fk.columnNames
                        .map((columnName) => `"${columnName}"`)
                        .join(", ")
                    if (!fk.name)
                        fk.name = this.connection.namingStrategy.foreignKeyName(
                            table,
                            fk.columnNames,
                            this.getTablePath(fk),
                            fk.referencedColumnNames,
                        )
                    const referencedColumnNames = fk.referencedColumnNames
                        .map((columnName) => `"${columnName}"`)
                        .join(", ")
                    let constraint = `CONSTRAINT "${
                        fk.name
                    }" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(
                        this.getTablePath(fk),
                    )} (${referencedColumnNames})`
                    if (fk.onDelete && fk.onDelete !== "NO ACTION") {
                        // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
                        constraint += ` ON DELETE ${fk.onDelete}`
                    }
                    return constraint
                })
                .join(", ")

            sql += `, ${foreignKeysSql}`
        }

        const primaryColumns = table.columns.filter(
            (column) => column.isPrimary,
        )
        if (primaryColumns.length > 0) {
            const primaryKeyName = primaryColumns[0].primaryKeyConstraintName
                ? primaryColumns[0].primaryKeyConstraintName
                : this.connection.namingStrategy.primaryKeyName(
                      table,
                      primaryColumns.map((column) => column.name),
                  )

            const columnNames = primaryColumns
                .map((column) => `"${column.name}"`)
                .join(", ")
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`
        }

        sql += `)`

        return new Query(sql)
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(
        tableOrName: Table | string,
        ifExist?: boolean,
    ): Query {
        const query = ifExist
            ? `DROP TABLE IF EXISTS ${this.escapePath(tableOrName)}`
            : `DROP TABLE ${this.escapePath(tableOrName)}`
        return new Query(query)
    }

    protected createViewSql(view: View): Query {
        const materializedClause = view.materialized ? "MATERIALIZED " : ""
        if (typeof view.expression === "string") {
            return new Query(
                `CREATE ${materializedClause}VIEW ${this.escapePath(view)} AS ${
                    view.expression
                }`,
            )
        } else {
            return new Query(
                `CREATE ${materializedClause}VIEW ${this.escapePath(
                    view,
                )} AS ${view.expression(this.connection).getQuery()}`,
            )
        }
    }

    protected insertViewDefinitionSql(view: View): Query {
        const expression =
            typeof view.expression === "string"
                ? view.expression.trim()
                : view.expression(this.connection).getQuery()
        const type = view.materialized
            ? MetadataTableType.MATERIALIZED_VIEW
            : MetadataTableType.VIEW
        const { schema, tableName } = this.driver.parseTableName(view)
        return this.insertTypeormMetadataSql({
            type: type,
            name: tableName,
            schema: schema,
            value: expression,
        })
    }

    /**
     * Builds drop view sql.
     */
    protected dropViewSql(view: View): Query {
        const materializedClause = view.materialized ? "MATERIALIZED " : ""
        return new Query(
            `DROP ${materializedClause}VIEW ${this.escapePath(view)}`,
        )
    }

    /**
     * Builds remove view sql.
     */
    protected deleteViewDefinitionSql(view: View): Query {
        const type = view.materialized
            ? MetadataTableType.MATERIALIZED_VIEW
            : MetadataTableType.VIEW
        return this.deleteTypeormMetadataSql({ type, name: view.name })
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames
            .map((columnName) => `"${columnName}"`)
            .join(", ")
        return new Query(
            `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${
                index.name
            }" ON ${this.escapePath(table)} (${columns})`,
        )
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(indexOrName: TableIndex | string): Query {
        const indexName = InstanceChecker.isTableIndex(indexOrName)
            ? indexOrName.name
            : indexOrName
        return new Query(`DROP INDEX "${indexName}"`)
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(
        table: Table,
        columnNames: string[],
        constraintName?: string,
    ): Query {
        const primaryKeyName = constraintName
            ? constraintName
            : this.connection.namingStrategy.primaryKeyName(table, columnNames)

        const columnNamesString = columnNames
            .map((columnName) => `"${columnName}"`)
            .join(", ")

        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`,
        )
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): Query {
        if (!table.primaryColumns.length)
            throw new TypeORMError(`Table ${table} has no primary keys.`)

        const columnNames = table.primaryColumns.map((column) => column.name)
        const constraintName = table.primaryColumns[0].primaryKeyConstraintName
        const primaryKeyName = constraintName
            ? constraintName
            : this.connection.namingStrategy.primaryKeyName(table, columnNames)

        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT "${primaryKeyName}"`,
        )
    }

    /**
     * Builds create unique constraint sql.
     */
    protected createUniqueConstraintSql(
        table: Table,
        uniqueConstraint: TableUnique,
    ): Query {
        const columnNames = uniqueConstraint.columnNames
            .map((column) => `"` + column + `"`)
            .join(", ")
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${
                uniqueConstraint.name
            }" UNIQUE (${columnNames})`,
        )
    }

    /**
     * Builds drop unique constraint sql.
     */
    protected dropUniqueConstraintSql(
        table: Table,
        uniqueOrName: TableUnique | string,
    ): Query {
        const uniqueName = InstanceChecker.isTableUnique(uniqueOrName)
            ? uniqueOrName.name
            : uniqueOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT "${uniqueName}"`,
        )
    }

    /**
     * Builds create check constraint sql.
     */
    protected createCheckConstraintSql(
        table: Table,
        checkConstraint: TableCheck,
    ): Query {
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${
                checkConstraint.name
            }" CHECK (${checkConstraint.expression})`,
        )
    }

    /**
     * Builds drop check constraint sql.
     */
    protected dropCheckConstraintSql(
        table: Table,
        checkOrName: TableCheck | string,
    ): Query {
        const checkName = InstanceChecker.isTableCheck(checkOrName)
            ? checkOrName.name
            : checkOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT "${checkName}"`,
        )
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(
        table: Table,
        foreignKey: TableForeignKey,
    ): Query {
        const columnNames = foreignKey.columnNames
            .map((column) => `"` + column + `"`)
            .join(", ")
        const referencedColumnNames = foreignKey.referencedColumnNames
            .map((column) => `"` + column + `"`)
            .join(",")
        let sql =
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${
                foreignKey.name
            }" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(
                this.getTablePath(foreignKey),
            )} (${referencedColumnNames})`
        // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
        if (foreignKey.onDelete && foreignKey.onDelete !== "NO ACTION") {
            sql += ` ON DELETE ${foreignKey.onDelete}`
        }
        return new Query(sql)
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(
        table: Table,
        foreignKeyOrName: TableForeignKey | string,
    ): Query {
        const foreignKeyName = InstanceChecker.isTableForeignKey(
            foreignKeyOrName,
        )
            ? foreignKeyOrName.name
            : foreignKeyOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT "${foreignKeyName}"`,
        )
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: TableColumn) {
        let c =
            `"${column.name}" ` + this.connection.driver.createFullType(column)
        if (column.charset) c += " CHARACTER SET " + column.charset
        if (column.collation) c += " COLLATE " + column.collation

        if (column.asExpression) c += ` AS (${column.asExpression}) VIRTUAL`

        if (column.default !== undefined && column.default !== null)
            // DEFAULT must be placed before NOT NULL
            c += " DEFAULT " + column.default
        if (column.isNullable !== true && !column.isGenerated)
            // NOT NULL is not supported with GENERATED
            c += " NOT NULL"
        if (
            column.isGenerated === true &&
            column.generationStrategy === "increment"
        )
            c += " GENERATED BY DEFAULT AS IDENTITY"

        return c
    }

    /**
     * Escapes given table or view path.
     */
    protected escapePath(target: Table | View | string): string {
        // Ignore database when escaping paths
        const { schema, tableName } = this.driver.parseTableName(target)

        if (schema && schema !== this.driver.schema) {
            return `"${schema}"."${tableName}"`
        }

        return `"${tableName}"`
    }

    /**
     * Change table comment.
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `oracle driver does not support change table comment.`,
        )
    }
}
