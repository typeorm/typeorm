import { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { ReadStream } from "../../platform/PlatformTools"
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner"
import { QueryResult } from "../../query-runner/QueryResult"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { TableIndexOptions } from "../../schema-builder/options/TableIndexOptions"
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
import { VersionUtils } from "../../util/VersionUtils"
import { DriverUtils } from "../DriverUtils"
import { Query } from "../Query"
import { ColumnType, UnsignedColumnType } from "../types/ColumnTypes"
import { IsolationLevel } from "../types/IsolationLevel"
import { MetadataTableType } from "../types/MetadataTableType"
import { ReplicationMode } from "../types/ReplicationMode"
import { MysqlDriver } from "./MysqlDriver"

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
    driver: MysqlDriver

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection from a pool for a first time.
     */
    protected databaseConnectionPromise: Promise<any>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: MysqlDriver, mode: ReplicationMode) {
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
    release(): Promise<void> {
        this.isReleased = true
        if (this.databaseConnection) this.databaseConnection.release()
        return Promise.resolve()
    }

    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }
        if (this.transactionDepth === 0) {
            if (isolationLevel) {
                await this.query(
                    "SET TRANSACTION ISOLATION LEVEL " + isolationLevel,
                )
            }
            await this.query("START TRANSACTION")
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

        if (this.transactionDepth > 1) {
            await this.query(
                `RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`,
            )
        } else {
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
     * Executes a raw SQL query.
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

        return new Promise(async (ok, fail) => {
            try {
                const enableQueryTimeout =
                    this.driver.options.enableQueryTimeout
                const maxQueryExecutionTime =
                    this.driver.options.maxQueryExecutionTime
                const queryPayload =
                    enableQueryTimeout && maxQueryExecutionTime
                        ? { sql: query, timeout: maxQueryExecutionTime }
                        : query
                databaseConnection.query(
                    queryPayload,
                    parameters,
                    (err: any, raw: any) => {
                        // log slow queries if maxQueryExecution time is set
                        const maxQueryExecutionTime =
                            this.driver.options.maxQueryExecutionTime
                        const queryEndTime = Date.now()
                        const queryExecutionTime = queryEndTime - queryStartTime

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

                        if (err) {
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

                            return fail(
                                new QueryFailedError(query, parameters, err),
                            )
                        }

                        this.broadcaster.broadcastAfterQueryEvent(
                            broadcasterResult,
                            query,
                            parameters,
                            true,
                            queryExecutionTime,
                            raw,
                            undefined,
                        )

                        const result = new QueryResult()

                        result.raw = raw

                        try {
                            result.records = Array.from(raw)
                        } catch {
                            // Do nothing.
                        }

                        if (raw?.hasOwnProperty("affectedRows")) {
                            result.affected = raw.affectedRows
                        }

                        if (useStructuredResult) {
                            ok(result)
                        } else {
                            ok(result.raw)
                        }
                    },
                )
            } catch (err) {
                fail(err)
            } finally {
                await broadcasterResult.wait()
            }
        })
    }

    /**
     * Returns raw data stream.
     */
    stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<ReadStream> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect()
                this.driver.connection.logger.logQuery(query, parameters, this)
                const databaseQuery = databaseConnection.query(
                    query,
                    parameters,
                )
                if (onEnd) databaseQuery.on("end", onEnd)
                if (onError) databaseQuery.on("error", onError)
                ok(databaseQuery.stream())
            } catch (err) {
                fail(err)
            }
        })
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
        throw new TypeORMError(`MySql driver does not support table schemas`)
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(
            `SELECT * FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\` = '${database}'`,
        )
        return result.length ? true : false
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        const query = await this.query(`SELECT DATABASE() AS \`db_name\``)
        return query[0]["db_name"]
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        throw new TypeORMError(`MySql driver does not support table schemas`)
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<string> {
        const query = await this.query(`SELECT SCHEMA() AS \`schema_name\``)
        return query[0]["schema_name"]
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}'`
        const result = await this.query(sql)
        return result.length ? true : false
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(
        tableOrName: Table | string,
        column: TableColumn | string,
    ): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)
        const columnName = InstanceChecker.isTableColumn(column)
            ? column.name
            : column
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}' AND \`COLUMN_NAME\` = '${columnName}'`
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
        const up = ifNotExist
            ? `CREATE DATABASE IF NOT EXISTS \`${database}\``
            : `CREATE DATABASE \`${database}\``
        const down = `DROP DATABASE \`${database}\``
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist
            ? `DROP DATABASE IF EXISTS \`${database}\``
            : `DROP DATABASE \`${database}\``
        const down = `CREATE DATABASE \`${database}\``
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(
        schemaPath: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema create queries are not supported by MySql driver.`,
        )
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new TypeORMError(
            `Schema drop queries are not supported by MySql driver.`,
        )
    }

    /**
     * Creates a new table.
     */
    async createTable(
        table: Table,
        ifNotExist: boolean = false,
        createForeignKeys: boolean = true,
    ): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table)
            if (isTableExist) return Promise.resolve()
        }
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        upQueries.push(this.createTableSql(table, createForeignKeys))
        downQueries.push(this.dropTableSql(table))

        // we must first drop indices, than drop foreign keys, because drop queries runs in reversed order
        // and foreign keys will be dropped first as indices. This order is very important, because we can't drop index
        // if it related to the foreign key.

        // createTable does not need separate method to create indices, because it create indices in the same query with table creation.
        table.indices.forEach((index) =>
            downQueries.push(this.dropIndexSql(table, index)),
        )

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach((foreignKey) =>
                downQueries.push(this.dropForeignKeySql(table, foreignKey)),
            )

        // if table has column with generated type, we must add the expression to the metadata table
        const generatedColumns = table.columns.filter(
            (column) => column.generatedType && column.asExpression,
        )

        for (const column of generatedColumns) {
            const currentDatabase = await this.getCurrentDatabase()

            const insertQuery = this.insertTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            upQueries.push(insertQuery)
            downQueries.push(deleteQuery)
        }

        return this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drop the table.
     */
    async dropTable(
        target: Table | string,
        ifExist?: boolean,
        dropForeignKeys: boolean = true,
    ): Promise<void> {
        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(target)
            if (!isTableExist) return Promise.resolve()
        }

        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys
        const tablePath = this.getTablePath(target)
        const table = await this.getCachedTable(tablePath)
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        if (dropForeignKeys)
            table.foreignKeys.forEach((foreignKey) =>
                upQueries.push(this.dropForeignKeySql(table, foreignKey)),
            )

        table.indices.forEach((index) =>
            upQueries.push(this.dropIndexSql(table, index)),
        )

        upQueries.push(this.dropTableSql(table))
        downQueries.push(this.createTableSql(table, createForeignKeys))

        // if table had columns with generated type, we must remove the expression from the metadata table
        const generatedColumns = table.columns.filter(
            (column) => column.generatedType && column.asExpression,
        )

        for (const column of generatedColumns) {
            const currentDatabase = await this.getCurrentDatabase()

            const deleteQuery = this.deleteTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            const insertQuery = this.insertTypeormMetadataSql({
                schema: currentDatabase,
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
        if (syncWithMetadata)
            upQueries.push(await this.insertViewDefinitionSql(view))
        downQueries.push(this.dropViewSql(view))
        if (syncWithMetadata)
            downQueries.push(await this.deleteViewDefinitionSql(view))
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
        upQueries.push(await this.deleteViewDefinitionSql(view))
        upQueries.push(this.dropViewSql(view))
        downQueries.push(await this.insertViewDefinitionSql(view))
        downQueries.push(this.createViewSql(view))
        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Renames a table.
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

        const { database } = this.driver.parseTableName(oldTable)

        newTable.name = database ? `${database}.${newTableName}` : newTableName

        // rename table
        upQueries.push(
            new Query(
                `RENAME TABLE ${this.escapePath(oldTable)} TO ${this.escapePath(
                    newTable,
                )}`,
            ),
        )
        downQueries.push(
            new Query(
                `RENAME TABLE ${this.escapePath(newTable)} TO ${this.escapePath(
                    oldTable,
                )}`,
            ),
        )

        // rename index constraints
        newTable.indices.forEach((index) => {
            const oldIndexName = this.connection.namingStrategy.indexName(
                oldTable,
                index.columnNames,
            )

            // Skip renaming if Index has user defined constraint name
            if (index.name !== oldIndexName) return

            // build new constraint name
            const columnNames = index.columnNames
                .map((column) => `\`${column}\``)
                .join(", ")
            const newIndexName = this.connection.namingStrategy.indexName(
                newTable,
                index.columnNames,
                index.where,
            )

            // build queries
            let indexType = ""
            if (index.isUnique) indexType += "UNIQUE "
            if (index.isSpatial) indexType += "SPATIAL "
            if (index.isFulltext) indexType += "FULLTEXT "
            const indexParser =
                index.isFulltext && index.parser
                    ? ` WITH PARSER ${index.parser}`
                    : ""

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(newTable)} DROP INDEX \`${
                        index.name
                    }\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})${indexParser}`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        newTable,
                    )} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${
                        index.name
                    }\` (${columnNames})${indexParser}`,
                ),
            )

            // replace constraint name
            index.name = newIndexName
        })

        // rename foreign key constraint
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
            const columnNames = foreignKey.columnNames
                .map((column) => `\`${column}\``)
                .join(", ")
            const referencedColumnNames = foreignKey.referencedColumnNames
                .map((column) => `\`${column}\``)
                .join(",")
            const newForeignKeyName =
                this.connection.namingStrategy.foreignKeyName(
                    newTable,
                    foreignKey.columnNames,
                    this.getTablePath(foreignKey),
                    foreignKey.referencedColumnNames,
                )

            // build queries
            let up =
                `ALTER TABLE ${this.escapePath(newTable)} DROP FOREIGN KEY \`${
                    foreignKey.name
                }\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                `REFERENCES ${this.escapePath(
                    this.getTablePath(foreignKey),
                )}(${referencedColumnNames})`
            if (foreignKey.onDelete) up += ` ON DELETE ${foreignKey.onDelete}`
            if (foreignKey.onUpdate) up += ` ON UPDATE ${foreignKey.onUpdate}`

            let down =
                `ALTER TABLE ${this.escapePath(
                    newTable,
                )} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${
                    foreignKey.name
                }\` FOREIGN KEY (${columnNames}) ` +
                `REFERENCES ${this.escapePath(
                    this.getTablePath(foreignKey),
                )}(${referencedColumnNames})`
            if (foreignKey.onDelete) down += ` ON DELETE ${foreignKey.onDelete}`
            if (foreignKey.onUpdate) down += ` ON UPDATE ${foreignKey.onUpdate}`

            upQueries.push(new Query(up))
            downQueries.push(new Query(down))

            // replace constraint name
            foreignKey.name = newForeignKeyName
        })

        await this.executeQueries(upQueries, downQueries)

        // rename old table and replace it in cached tabled;
        oldTable.name = newTable.name
        this.replaceCachedTable(oldTable, newTable)
    }

    /**
     * Change table comment.
     */
    async changeTableComment(
        tableOrName: Table | string,
        newComment?: string,
    ): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)

        newComment = this.escapeComment(newComment)
        const comment = this.escapeComment(table.comment)

        if (newComment === comment) {
            return
        }

        const newTable = table.clone()

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    newTable,
                )} COMMENT ${newComment}`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(table)} COMMENT ${comment}`,
            ),
        )

        await this.executeQueries(upQueries, downQueries)

        // change table comment and replace it in cached tabled;
        table.comment = newTable.comment
        this.replaceCachedTable(table, newTable)
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
        const skipColumnLevelPrimary = clonedTable.primaryColumns.length > 0

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD ${this.buildCreateColumnSql(
                    column,
                    skipColumnLevelPrimary,
                    false,
                )}`,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(table)} DROP COLUMN \`${
                    column.name
                }\``,
            ),
        )

        // create or update primary key constraint
        if (column.isPrimary && skipColumnLevelPrimary) {
            // if we already have generated column, we must temporary drop AUTO_INCREMENT property.
            const generatedColumn = clonedTable.columns.find(
                (column) =>
                    column.isGenerated &&
                    column.generationStrategy === "increment",
            )
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone()
                nonGeneratedColumn.isGenerated = false
                nonGeneratedColumn.generationStrategy = undefined
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            column.name
                        }\` ${this.buildCreateColumnSql(
                            nonGeneratedColumn,
                            true,
                        )}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            nonGeneratedColumn.name
                        }\` ${this.buildCreateColumnSql(column, true)}`,
                    ),
                )
            }

            const primaryColumns = clonedTable.primaryColumns
            let columnNames = primaryColumns
                .map((column) => `\`${column.name}\``)
                .join(", ")
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD PRIMARY KEY (${columnNames})`,
                ),
            )

            primaryColumns.push(column)
            columnNames = primaryColumns
                .map((column) => `\`${column.name}\``)
                .join(", ")
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD PRIMARY KEY (${columnNames})`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`,
                ),
            )

            // if we previously dropped AUTO_INCREMENT property, we must bring it back
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone()
                nonGeneratedColumn.isGenerated = false
                nonGeneratedColumn.generationStrategy = undefined
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            nonGeneratedColumn.name
                        }\` ${this.buildCreateColumnSql(column, true)}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            column.name
                        }\` ${this.buildCreateColumnSql(
                            nonGeneratedColumn,
                            true,
                        )}`,
                    ),
                )
            }
        }

        if (column.generatedType && column.asExpression) {
            const currentDatabase = await this.getCurrentDatabase()
            const insertQuery = this.insertTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            upQueries.push(insertQuery)
            downQueries.push(deleteQuery)
        }

        // create column index
        const columnIndex = clonedTable.indices.find(
            (index) =>
                index.columnNames.length === 1 &&
                index.columnNames[0] === column.name,
        )
        if (columnIndex) {
            upQueries.push(this.createIndexSql(table, columnIndex))
            downQueries.push(this.dropIndexSql(table, columnIndex))
        } else if (column.isUnique) {
            const uniqueIndex = new TableIndex({
                name: this.connection.namingStrategy.indexName(table, [
                    column.name,
                ]),
                columnNames: [column.name],
                isUnique: true,
            })
            clonedTable.indices.push(uniqueIndex)
            clonedTable.uniques.push(
                new TableUnique({
                    name: uniqueIndex.name,
                    columnNames: uniqueIndex.columnNames,
                }),
            )
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} ADD UNIQUE INDEX \`${
                        uniqueIndex.name
                    }\` (\`${column.name}\`)`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${
                        uniqueIndex.name
                    }\``,
                ),
            )
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
                `Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`,
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
        oldColumnOrName: TableColumn | string,
        newColumn: TableColumn,
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        let clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        const oldColumn = InstanceChecker.isTableColumn(oldColumnOrName)
            ? oldColumnOrName
            : table.columns.find((column) => column.name === oldColumnOrName)
        if (!oldColumn)
            throw new TypeORMError(
                `Column "${oldColumnOrName}" was not found in the "${table.name}" table.`,
            )

        if (
            (newColumn.isGenerated !== oldColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid") ||
            oldColumn.type !== newColumn.type ||
            oldColumn.length !== newColumn.length ||
            (oldColumn.generatedType &&
                newColumn.generatedType &&
                oldColumn.generatedType !== newColumn.generatedType) ||
            (!oldColumn.generatedType &&
                newColumn.generatedType === "VIRTUAL") ||
            (oldColumn.generatedType === "VIRTUAL" && !newColumn.generatedType)
        ) {
            await this.dropColumn(table, oldColumn)
            await this.addColumn(table, newColumn)

            // update cloned table
            clonedTable = table.clone()
        } else {
            if (newColumn.name !== oldColumn.name) {
                // We don't change any column properties, just rename it.
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            oldColumn.name
                        }\` \`${newColumn.name}\` ${this.buildCreateColumnSql(
                            oldColumn,
                            true,
                            true,
                        )}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            newColumn.name
                        }\` \`${oldColumn.name}\` ${this.buildCreateColumnSql(
                            oldColumn,
                            true,
                            true,
                        )}`,
                    ),
                )

                // rename index constraints
                clonedTable.findColumnIndices(oldColumn).forEach((index) => {
                    const oldUniqueName =
                        this.connection.namingStrategy.indexName(
                            clonedTable,
                            index.columnNames,
                        )

                    // Skip renaming if Index has user defined constraint name
                    if (index.name !== oldUniqueName) return

                    // build new constraint name
                    index.columnNames.splice(
                        index.columnNames.indexOf(oldColumn.name),
                        1,
                    )
                    index.columnNames.push(newColumn.name)
                    const columnNames = index.columnNames
                        .map((column) => `\`${column}\``)
                        .join(", ")
                    const newIndexName =
                        this.connection.namingStrategy.indexName(
                            clonedTable,
                            index.columnNames,
                            index.where,
                        )

                    // build queries
                    let indexType = ""
                    if (index.isUnique) indexType += "UNIQUE "
                    if (index.isSpatial) indexType += "SPATIAL "
                    if (index.isFulltext) indexType += "FULLTEXT "
                    const indexParser =
                        index.isFulltext && index.parser
                            ? ` WITH PARSER ${index.parser}`
                            : ""

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP INDEX \`${
                                index.name
                            }\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})${indexParser}`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${
                                index.name
                            }\` (${columnNames})${indexParser}`,
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
                        const columnNames = foreignKey.columnNames
                            .map((column) => `\`${column}\``)
                            .join(", ")
                        const referencedColumnNames =
                            foreignKey.referencedColumnNames
                                .map((column) => `\`${column}\``)
                                .join(",")
                        const newForeignKeyName =
                            this.connection.namingStrategy.foreignKeyName(
                                clonedTable,
                                foreignKey.columnNames,
                                this.getTablePath(foreignKey),
                                foreignKey.referencedColumnNames,
                            )

                        // build queries
                        let up =
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP FOREIGN KEY \`${
                                foreignKey.name
                            }\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                            `REFERENCES ${this.escapePath(
                                this.getTablePath(foreignKey),
                            )}(${referencedColumnNames})`
                        if (foreignKey.onDelete)
                            up += ` ON DELETE ${foreignKey.onDelete}`
                        if (foreignKey.onUpdate)
                            up += ` ON UPDATE ${foreignKey.onUpdate}`

                        let down =
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${
                                foreignKey.name
                            }\` FOREIGN KEY (${columnNames}) ` +
                            `REFERENCES ${this.escapePath(
                                this.getTablePath(foreignKey),
                            )}(${referencedColumnNames})`
                        if (foreignKey.onDelete)
                            down += ` ON DELETE ${foreignKey.onDelete}`
                        if (foreignKey.onUpdate)
                            down += ` ON UPDATE ${foreignKey.onUpdate}`

                        upQueries.push(new Query(up))
                        downQueries.push(new Query(down))

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

            if (this.isColumnChanged(oldColumn, newColumn, true, true)) {
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            oldColumn.name
                        }\` ${this.buildCreateColumnSql(newColumn, true)}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            newColumn.name
                        }\` ${this.buildCreateColumnSql(oldColumn, true)}`,
                    ),
                )

                if (oldColumn.generatedType && !newColumn.generatedType) {
                    // if column changed from generated to non-generated, delete record from typeorm metadata

                    const currentDatabase = await this.getCurrentDatabase()
                    const deleteQuery = this.deleteTypeormMetadataSql({
                        schema: currentDatabase,
                        table: table.name,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: oldColumn.name,
                    })
                    const insertQuery = this.insertTypeormMetadataSql({
                        schema: currentDatabase,
                        table: table.name,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: oldColumn.name,
                        value: oldColumn.asExpression,
                    })

                    upQueries.push(deleteQuery)
                    downQueries.push(insertQuery)
                } else if (
                    !oldColumn.generatedType &&
                    newColumn.generatedType
                ) {
                    // if column changed from non-generated to generated, insert record into typeorm metadata

                    const currentDatabase = await this.getCurrentDatabase()
                    const insertQuery = this.insertTypeormMetadataSql({
                        schema: currentDatabase,
                        table: table.name,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: newColumn.name,
                        value: newColumn.asExpression,
                    })
                    const deleteQuery = this.deleteTypeormMetadataSql({
                        schema: currentDatabase,
                        table: table.name,
                        type: MetadataTableType.GENERATED_COLUMN,
                        name: newColumn.name,
                    })

                    upQueries.push(insertQuery)
                    downQueries.push(deleteQuery)
                } else if (oldColumn.asExpression !== newColumn.asExpression) {
                    // if only expression changed, just update it in typeorm_metadata table
                    const currentDatabase = await this.getCurrentDatabase()
                    const updateQuery = this.connection
                        .createQueryBuilder()
                        .update(this.getTypeormMetadataTableName())
                        .set({ value: newColumn.asExpression })
                        .where("`type` = :type", {
                            type: MetadataTableType.GENERATED_COLUMN,
                        })
                        .andWhere("`name` = :name", { name: oldColumn.name })
                        .andWhere("`schema` = :schema", {
                            schema: currentDatabase,
                        })
                        .andWhere("`table` = :table", { table: table.name })
                        .getQueryAndParameters()

                    const revertUpdateQuery = this.connection
                        .createQueryBuilder()
                        .update(this.getTypeormMetadataTableName())
                        .set({ value: oldColumn.asExpression })
                        .where("`type` = :type", {
                            type: MetadataTableType.GENERATED_COLUMN,
                        })
                        .andWhere("`name` = :name", { name: newColumn.name })
                        .andWhere("`schema` = :schema", {
                            schema: currentDatabase,
                        })
                        .andWhere("`table` = :table", { table: table.name })
                        .getQueryAndParameters()

                    upQueries.push(new Query(updateQuery[0], updateQuery[1]))
                    downQueries.push(
                        new Query(revertUpdateQuery[0], revertUpdateQuery[1]),
                    )
                }
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
                const generatedColumn = clonedTable.columns.find(
                    (column) =>
                        column.isGenerated &&
                        column.generationStrategy === "increment",
                )
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone()
                    nonGeneratedColumn.isGenerated = false
                    nonGeneratedColumn.generationStrategy = undefined

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                                generatedColumn.name
                            }\` ${this.buildCreateColumnSql(
                                nonGeneratedColumn,
                                true,
                            )}`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                                nonGeneratedColumn.name
                            }\` ${this.buildCreateColumnSql(
                                generatedColumn,
                                true,
                            )}`,
                        ),
                    )
                }

                const primaryColumns = clonedTable.primaryColumns

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const columnNames = primaryColumns
                        .map((column) => `\`${column.name}\``)
                        .join(", ")
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP PRIMARY KEY`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD PRIMARY KEY (${columnNames})`,
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
                    const columnNames = primaryColumns
                        .map((column) => `\`${column.name}\``)
                        .join(", ")
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD PRIMARY KEY (${columnNames})`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP PRIMARY KEY`,
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
                        const columnNames = primaryColumns
                            .map((column) => `\`${column.name}\``)
                            .join(", ")
                        upQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} ADD PRIMARY KEY (${columnNames})`,
                            ),
                        )
                        downQueries.push(
                            new Query(
                                `ALTER TABLE ${this.escapePath(
                                    table,
                                )} DROP PRIMARY KEY`,
                            ),
                        )
                    }
                }

                // if we have generated column, and we dropped AUTO_INCREMENT property before, we must bring it back
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone()
                    nonGeneratedColumn.isGenerated = false
                    nonGeneratedColumn.generationStrategy = undefined

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                                nonGeneratedColumn.name
                            }\` ${this.buildCreateColumnSql(
                                generatedColumn,
                                true,
                            )}`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                                generatedColumn.name
                            }\` ${this.buildCreateColumnSql(
                                nonGeneratedColumn,
                                true,
                            )}`,
                        ),
                    )
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueIndex = new TableIndex({
                        name: this.connection.namingStrategy.indexName(table, [
                            newColumn.name,
                        ]),
                        columnNames: [newColumn.name],
                        isUnique: true,
                    })
                    clonedTable.indices.push(uniqueIndex)
                    clonedTable.uniques.push(
                        new TableUnique({
                            name: uniqueIndex.name,
                            columnNames: uniqueIndex.columnNames,
                        }),
                    )
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${
                                newColumn.name
                            }\`)`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP INDEX \`${uniqueIndex.name}\``,
                        ),
                    )
                } else {
                    const uniqueIndex = clonedTable.indices.find((index) => {
                        return (
                            index.columnNames.length === 1 &&
                            index.isUnique === true &&
                            !!index.columnNames.find(
                                (columnName) => columnName === newColumn.name,
                            )
                        )
                    })
                    clonedTable.indices.splice(
                        clonedTable.indices.indexOf(uniqueIndex!),
                        1,
                    )

                    const tableUnique = clonedTable.uniques.find(
                        (unique) => unique.name === uniqueIndex!.name,
                    )
                    clonedTable.uniques.splice(
                        clonedTable.uniques.indexOf(tableUnique!),
                        1,
                    )

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP INDEX \`${uniqueIndex!.name}\``,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD UNIQUE INDEX \`${uniqueIndex!.name}\` (\`${
                                newColumn.name
                            }\`)`,
                        ),
                    )
                }
            }
        }

        await this.executeQueries(upQueries, downQueries)
        this.replaceCachedTable(table, clonedTable)
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
                `Column "${columnOrName}" was not found in table "${table.name}"`,
            )

        const clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        // drop primary key constraint
        if (column.isPrimary) {
            // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
            const generatedColumn = clonedTable.columns.find(
                (column) =>
                    column.isGenerated &&
                    column.generationStrategy === "increment",
            )
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone()
                nonGeneratedColumn.isGenerated = false
                nonGeneratedColumn.generationStrategy = undefined

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            generatedColumn.name
                        }\` ${this.buildCreateColumnSql(
                            nonGeneratedColumn,
                            true,
                        )}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            nonGeneratedColumn.name
                        }\` ${this.buildCreateColumnSql(
                            generatedColumn,
                            true,
                        )}`,
                    ),
                )
            }

            // dropping primary key constraint
            const columnNames = clonedTable.primaryColumns
                .map((primaryColumn) => `\`${primaryColumn.name}\``)
                .join(", ")
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        clonedTable,
                    )} DROP PRIMARY KEY`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        clonedTable,
                    )} ADD PRIMARY KEY (${columnNames})`,
                ),
            )

            // update column in table
            const tableColumn = clonedTable.findColumnByName(column.name)
            tableColumn!.isPrimary = false

            // if primary key have multiple columns, we must recreate it without dropped column
            if (clonedTable.primaryColumns.length > 0) {
                const columnNames = clonedTable.primaryColumns
                    .map((primaryColumn) => `\`${primaryColumn.name}\``)
                    .join(", ")
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            clonedTable,
                        )} ADD PRIMARY KEY (${columnNames})`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            clonedTable,
                        )} DROP PRIMARY KEY`,
                    ),
                )
            }

            // if we have generated column, and we dropped AUTO_INCREMENT property before, and this column is not current dropping column, we must bring it back
            if (generatedColumn && generatedColumn.name !== column.name) {
                const nonGeneratedColumn = generatedColumn.clone()
                nonGeneratedColumn.isGenerated = false
                nonGeneratedColumn.generationStrategy = undefined

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            nonGeneratedColumn.name
                        }\` ${this.buildCreateColumnSql(
                            generatedColumn,
                            true,
                        )}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                            generatedColumn.name
                        }\` ${this.buildCreateColumnSql(
                            nonGeneratedColumn,
                            true,
                        )}`,
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
            clonedTable.indices.splice(
                clonedTable.indices.indexOf(columnIndex),
                1,
            )
            upQueries.push(this.dropIndexSql(table, columnIndex))
            downQueries.push(this.createIndexSql(table, columnIndex))
        } else if (column.isUnique) {
            // we splice constraints both from table uniques and indices.
            const uniqueName =
                this.connection.namingStrategy.uniqueConstraintName(table, [
                    column.name,
                ])
            const foundUnique = clonedTable.uniques.find(
                (unique) => unique.name === uniqueName,
            )
            if (foundUnique)
                clonedTable.uniques.splice(
                    clonedTable.uniques.indexOf(foundUnique),
                    1,
                )

            const indexName = this.connection.namingStrategy.indexName(table, [
                column.name,
            ])
            const foundIndex = clonedTable.indices.find(
                (index) => index.name === indexName,
            )
            if (foundIndex)
                clonedTable.indices.splice(
                    clonedTable.indices.indexOf(foundIndex),
                    1,
                )

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} DROP INDEX \`${indexName}\``,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD UNIQUE INDEX \`${indexName}\` (\`${column.name}\`)`,
                ),
            )
        }

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(table)} DROP COLUMN \`${
                    column.name
                }\``,
            ),
        )
        downQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD ${this.buildCreateColumnSql(column, true)}`,
            ),
        )

        if (column.generatedType && column.asExpression) {
            const currentDatabase = await this.getCurrentDatabase()
            const deleteQuery = this.deleteTypeormMetadataSql({
                schema: currentDatabase,
                table: table.name,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })
            const insertQuery = this.insertTypeormMetadataSql({
                schema: currentDatabase,
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
    ): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const clonedTable = table.clone()

        const up = this.createPrimaryKeySql(table, columnNames)
        const down = this.dropPrimaryKeySql(table)

        await this.executeQueries(up, down)
        clonedTable.columns.forEach((column) => {
            if (columnNames.find((columnName) => columnName === column.name))
                column.isPrimary = true
        })
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
        const clonedTable = table.clone()
        const columnNames = columns.map((column) => column.name)
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
        const generatedColumn = clonedTable.columns.find(
            (column) =>
                column.isGenerated && column.generationStrategy === "increment",
        )
        if (generatedColumn) {
            const nonGeneratedColumn = generatedColumn.clone()
            nonGeneratedColumn.isGenerated = false
            nonGeneratedColumn.generationStrategy = undefined

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                        generatedColumn.name
                    }\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                        nonGeneratedColumn.name
                    }\` ${this.buildCreateColumnSql(generatedColumn, true)}`,
                ),
            )
        }

        // if table already have primary columns, we must drop them.
        const primaryColumns = clonedTable.primaryColumns
        if (primaryColumns.length > 0) {
            const columnNames = primaryColumns
                .map((column) => `\`${column.name}\``)
                .join(", ")
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD PRIMARY KEY (${columnNames})`,
                ),
            )
        }

        // update columns in table.
        clonedTable.columns
            .filter((column) => columnNames.indexOf(column.name) !== -1)
            .forEach((column) => (column.isPrimary = true))

        const columnNamesString = columnNames
            .map((columnName) => `\`${columnName}\``)
            .join(", ")
        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} ADD PRIMARY KEY (${columnNamesString})`,
            ),
        )
        downQueries.push(
            new Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`),
        )

        // if we already have generated column or column is changed to generated, and we dropped AUTO_INCREMENT property before, we must bring it back
        const newOrExistGeneratedColumn = generatedColumn
            ? generatedColumn
            : columns.find(
                  (column) =>
                      column.isGenerated &&
                      column.generationStrategy === "increment",
              )
        if (newOrExistGeneratedColumn) {
            const nonGeneratedColumn = newOrExistGeneratedColumn.clone()
            nonGeneratedColumn.isGenerated = false
            nonGeneratedColumn.generationStrategy = undefined

            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                        nonGeneratedColumn.name
                    }\` ${this.buildCreateColumnSql(
                        newOrExistGeneratedColumn,
                        true,
                    )}`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(table)} CHANGE \`${
                        newOrExistGeneratedColumn.name
                    }\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`,
                ),
            )

            // if column changed to generated, we must update it in table
            const changedGeneratedColumn = clonedTable.columns.find(
                (column) => column.name === newOrExistGeneratedColumn.name,
            )
            changedGeneratedColumn!.isGenerated = true
            changedGeneratedColumn!.generationStrategy = "increment"
        }

        await this.executeQueries(upQueries, downQueries)
        this.replaceCachedTable(table, clonedTable)
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table | string): Promise<void> {
        const table = InstanceChecker.isTable(tableOrName)
            ? tableOrName
            : await this.getCachedTable(tableOrName)
        const up = this.dropPrimaryKeySql(table)
        const down = this.createPrimaryKeySql(
            table,
            table.primaryColumns.map((column) => column.name),
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
        throw new TypeORMError(
            `MySql does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Creates a new unique constraints.
     */
    async createUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new TypeORMError(
            `MySql does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Drops a unique constraint.
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
    ): Promise<void> {
        throw new TypeORMError(
            `MySql does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Drops a unique constraints.
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new TypeORMError(
            `MySql does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Creates a new check constraint.
     */
    async createCheckConstraint(
        tableOrName: Table | string,
        checkConstraint: TableCheck,
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support check constraints.`)
    }

    /**
     * Creates a new check constraints.
     */
    async createCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support check constraints.`)
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(
        tableOrName: Table | string,
        checkOrName: TableCheck | string,
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support check constraints.`)
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support check constraints.`)
    }

    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint(
        tableOrName: Table | string,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support exclusion constraints.`)
    }

    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support exclusion constraints.`)
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(
        tableOrName: Table | string,
        exclusionOrName: TableExclusion | string,
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support exclusion constraints.`)
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(`MySql does not support exclusion constraints.`)
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
     * Drops a foreign key.
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

        if (!foreignKey.name) {
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(
                table,
                foreignKey.columnNames,
                this.getTablePath(foreignKey),
                foreignKey.referencedColumnNames,
            )
        }

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
        const down = this.dropIndexSql(table, index)
        await this.executeQueries(up, down)
        table.addIndex(index, true)
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
     * Drops an index.
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

        const up = this.dropIndexSql(table, index)
        const down = this.createIndexSql(table, index)
        await this.executeQueries(up, down)
        table.removeIndex(index, true)
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
    async clearTable(tableOrName: Table | string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapePath(tableOrName)}`)
    }

    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(database?: string): Promise<void> {
        const dbName = database ? database : this.driver.database
        if (dbName) {
            const isDatabaseExist = await this.hasDatabase(dbName)
            if (!isDatabaseExist) return Promise.resolve()
        } else {
            throw new TypeORMError(
                `Can not clear database. No database is specified`,
            )
        }

        const isAnotherTransactionActive = this.isTransactionActive
        if (!isAnotherTransactionActive) await this.startTransaction()
        try {
            const selectViewDropsQuery = `SELECT concat('DROP VIEW IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`VIEWS\` WHERE \`TABLE_SCHEMA\` = '${dbName}'`
            const dropViewQueries: ObjectLiteral[] =
                await this.query(selectViewDropsQuery)
            await Promise.all(
                dropViewQueries.map((q) => this.query(q["query"])),
            )

            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE \`TABLE_SCHEMA\` = '${dbName}'`
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`

            await this.query(disableForeignKeysCheckQuery)
            const dropQueries: ObjectLiteral[] =
                await this.query(dropTablesQuery)
            await Promise.all(
                dropQueries.map((query) => this.query(query["query"])),
            )
            await this.query(enableForeignKeysCheckQuery)

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
        const viewsCondition = viewNames
            .map((tableName) => {
                let { database, tableName: name } =
                    this.driver.parseTableName(tableName)

                if (!database) {
                    database = currentDatabase
                }

                return `(\`t\`.\`schema\` = '${database}' AND \`t\`.\`name\` = '${name}')`
            })
            .join(" OR ")

        const query =
            `SELECT \`t\`.*, \`v\`.\`check_option\` FROM ${this.escapePath(
                this.getTypeormMetadataTableName(),
            )} \`t\` ` +
            `INNER JOIN \`information_schema\`.\`views\` \`v\` ON \`v\`.\`table_schema\` = \`t\`.\`schema\` AND \`v\`.\`table_name\` = \`t\`.\`name\` WHERE \`t\`.\`type\` = '${
                MetadataTableType.VIEW
            }' ${viewsCondition ? `AND (${viewsCondition})` : ""}`
        const dbViews = await this.query(query)
        return dbViews.map((dbView: any) => {
            const view = new View()
            const db =
                dbView["schema"] === currentDatabase
                    ? undefined
                    : dbView["schema"]
            view.database = dbView["schema"]
            view.name = this.driver.buildTableName(
                dbView["name"],
                undefined,
                db,
            )
            view.expression = dbView["value"]
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

        const currentDatabase = await this.getCurrentDatabase()

        // The following SQL brought to you by:
        //   A terrible understanding of https://dev.mysql.com/doc/refman/8.0/en/information-schema-optimization.html
        //
        // Short Version:
        // INFORMATION_SCHEMA is a weird metadata virtual table and follows VERY FEW of the normal
        // query optimization rules.  Depending on the columns you query against & the columns you're SELECTing
        // there can be a drastically different query performance - this is because the tables map to
        // data on the disk and some pieces of data require a scan of the data directory, the database files, etc

        // With most of these, you'll want to do an `EXPLAIN` when making changes to make sure
        // the changes you're making aren't changing the query performance profile negatively
        // When you do the explain you'll want to look at the `Extra` field -
        // It will look something like: "Using where; {FILE_OPENING}; Scanned {DB_NUM} databases"
        // FILE_OPENING will commonly be OPEN_FRM_ONLY or OPEN_FULL_TABLE - you want to aim to NOT do
        // an OPEN_FULL_TABLE unless necessary. DB_NUM may be a number or "all" - you really want to
        // keep this to 0 or 1.  Ideally 0. "All" means you've scanned all databases - not good.
        //
        // For more info, see the above link to the MySQL docs.
        //
        // Something not noted in the docs is that complex `WHERE` clauses - such as `OR` expressions -
        // will cause the query to not hit the optimizations & do full scans.  This is why
        // a number of queries below do `UNION`s of single `WHERE` clauses.

        const dbTables: {
            TABLE_SCHEMA: string
            TABLE_NAME: string
            TABLE_COMMENT: string
        }[] = []

        if (!tableNames) {
            // Since we don't have any of this data we have to do a scan
            const tablesSql = `SELECT \`TABLE_SCHEMA\`, \`TABLE_NAME\`, \`TABLE_COMMENT\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\``

            dbTables.push(...(await this.query(tablesSql)))
        } else {
            // Avoid data directory scan: TABLE_SCHEMA
            // Avoid database directory scan: TABLE_NAME
            // We only use `TABLE_SCHEMA` and `TABLE_NAME` which is `SKIP_OPEN_TABLE`
            const tablesSql = tableNames
                .filter((tableName) => tableName)
                .map((tableName) => {
                    let { database, tableName: name } =
                        this.driver.parseTableName(tableName)

                    if (!database) {
                        database = currentDatabase
                    }

                    return `SELECT \`TABLE_SCHEMA\`, \`TABLE_NAME\`, \`TABLE_COMMENT\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE \`TABLE_SCHEMA\` = '${database}' AND \`TABLE_NAME\` = '${name}'`
                })
                .join(" UNION ")

            dbTables.push(...(await this.query(tablesSql)))
        }

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length) return []

        // Avoid data directory scan: TABLE_SCHEMA
        // Avoid database directory scan: TABLE_NAME
        // Full columns: CARDINALITY & INDEX_TYPE - everything else is FRM only
        const statsSubquerySql = dbTables
            .map(({ TABLE_SCHEMA, TABLE_NAME }) => {
                return `
                SELECT
                    *
                FROM \`INFORMATION_SCHEMA\`.\`STATISTICS\`
                WHERE
                    \`TABLE_SCHEMA\` = '${TABLE_SCHEMA}'
                    AND
                    \`TABLE_NAME\` = '${TABLE_NAME}'
            `
            })
            .join(" UNION ")

        // Avoid data directory scan: TABLE_SCHEMA
        // Avoid database directory scan: TABLE_NAME
        // All columns will hit the full table.
        const kcuSubquerySql = dbTables
            .map(({ TABLE_SCHEMA, TABLE_NAME }) => {
                return `
                SELECT
                    *
                FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`kcu\`
                WHERE
                    \`kcu\`.\`TABLE_SCHEMA\` = '${TABLE_SCHEMA}'
                    AND
                    \`kcu\`.\`TABLE_NAME\` = '${TABLE_NAME}'
            `
            })
            .join(" UNION ")

        // Avoid data directory scan: CONSTRAINT_SCHEMA
        // Avoid database directory scan: TABLE_NAME
        // All columns will hit the full table.
        const rcSubquerySql = dbTables
            .map(({ TABLE_SCHEMA, TABLE_NAME }) => {
                return `
                SELECT
                    *
                FROM \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\`
                WHERE
                    \`CONSTRAINT_SCHEMA\` = '${TABLE_SCHEMA}'
                    AND
                    \`TABLE_NAME\` = '${TABLE_NAME}'
            `
            })
            .join(" UNION ")

        // Avoid data directory scan: TABLE_SCHEMA
        // Avoid database directory scan: TABLE_NAME
        // OPEN_FRM_ONLY applies to all columns
        const columnsSql = dbTables
            .map(({ TABLE_SCHEMA, TABLE_NAME }) => {
                return `
                SELECT
                    *
                FROM
                    \`INFORMATION_SCHEMA\`.\`COLUMNS\`
                WHERE
                    \`TABLE_SCHEMA\` = '${TABLE_SCHEMA}'
                    AND
                    \`TABLE_NAME\` = '${TABLE_NAME}'
                `
            })
            .join(" UNION ")

        // No Optimizations are available for COLLATIONS
        const collationsSql = `
            SELECT
                \`SCHEMA_NAME\`,
                \`DEFAULT_CHARACTER_SET_NAME\` as \`CHARSET\`,
                \`DEFAULT_COLLATION_NAME\` AS \`COLLATION\`
            FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\`
            `

        // Key Column Usage but only for PKs
        const primaryKeySql = `SELECT * FROM (${kcuSubquerySql}) \`kcu\` WHERE \`CONSTRAINT_NAME\` = 'PRIMARY'`

        // Combine stats & referential constraints
        const indicesSql = `
            SELECT
                \`s\`.*
            FROM (${statsSubquerySql}) \`s\`
            LEFT JOIN (${rcSubquerySql}) \`rc\`
                ON
                    \`s\`.\`INDEX_NAME\` = \`rc\`.\`CONSTRAINT_NAME\`
                    AND
                    \`s\`.\`TABLE_SCHEMA\` = \`rc\`.\`CONSTRAINT_SCHEMA\`
            WHERE
                \`s\`.\`INDEX_NAME\` != 'PRIMARY'
                AND
                \`rc\`.\`CONSTRAINT_NAME\` IS NULL
            `

        // Combine Key Column Usage & Referential Constraints
        const foreignKeysSql = `
            SELECT
                \`kcu\`.\`TABLE_SCHEMA\`,
                \`kcu\`.\`TABLE_NAME\`,
                \`kcu\`.\`CONSTRAINT_NAME\`,
                \`kcu\`.\`COLUMN_NAME\`,
                \`kcu\`.\`REFERENCED_TABLE_SCHEMA\`,
                \`kcu\`.\`REFERENCED_TABLE_NAME\`,
                \`kcu\`.\`REFERENCED_COLUMN_NAME\`,
                \`rc\`.\`DELETE_RULE\` \`ON_DELETE\`,
                \`rc\`.\`UPDATE_RULE\` \`ON_UPDATE\`
            FROM (${kcuSubquerySql}) \`kcu\`
            INNER JOIN (${rcSubquerySql}) \`rc\`
                ON
                    \`rc\`.\`CONSTRAINT_SCHEMA\` = \`kcu\`.\`CONSTRAINT_SCHEMA\`
                    AND
                    \`rc\`.\`TABLE_NAME\` = \`kcu\`.\`TABLE_NAME\`
                    AND
                    \`rc\`.\`CONSTRAINT_NAME\` = \`kcu\`.\`CONSTRAINT_NAME\`
            `

        const [
            dbColumns,
            dbPrimaryKeys,
            dbCollations,
            dbIndices,
            dbForeignKeys,
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(primaryKeySql),
            this.query(collationsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
        ])

        const isMariaDb = this.driver.options.type === "mariadb"
        const dbVersion = this.driver.version

        // create tables for loaded tables
        return Promise.all(
            dbTables.map(async (dbTable) => {
                const table = new Table()

                const dbCollation = dbCollations.find(
                    (coll) => coll["SCHEMA_NAME"] === dbTable["TABLE_SCHEMA"],
                )!
                const defaultCollation = dbCollation["COLLATION"]
                const defaultCharset = dbCollation["CHARSET"]

                // We do not need to join database name, when database is by default.
                const db =
                    dbTable["TABLE_SCHEMA"] === currentDatabase
                        ? undefined
                        : dbTable["TABLE_SCHEMA"]
                table.database = dbTable["TABLE_SCHEMA"]
                table.name = this.driver.buildTableName(
                    dbTable["TABLE_NAME"],
                    undefined,
                    db,
                )

                // create columns from the loaded columns
                table.columns = await Promise.all(
                    dbColumns
                        .filter(
                            (dbColumn) =>
                                dbColumn["TABLE_NAME"] ===
                                    dbTable["TABLE_NAME"] &&
                                dbColumn["TABLE_SCHEMA"] ===
                                    dbTable["TABLE_SCHEMA"],
                        )
                        .map(async (dbColumn) => {
                            const columnUniqueIndices = dbIndices.filter(
                                (dbIndex) => {
                                    return (
                                        dbIndex["TABLE_NAME"] ===
                                            dbTable["TABLE_NAME"] &&
                                        dbIndex["TABLE_SCHEMA"] ===
                                            dbTable["TABLE_SCHEMA"] &&
                                        dbIndex["COLUMN_NAME"] ===
                                            dbColumn["COLUMN_NAME"] &&
                                        parseInt(dbIndex["NON_UNIQUE"], 10) ===
                                            0
                                    )
                                },
                            )

                            const tableMetadata =
                                this.connection.entityMetadatas.find(
                                    (metadata) =>
                                        this.getTablePath(table) ===
                                        this.getTablePath(metadata),
                                )
                            const hasIgnoredIndex =
                                columnUniqueIndices.length > 0 &&
                                tableMetadata &&
                                tableMetadata.indices.some((index) => {
                                    return columnUniqueIndices.some(
                                        (uniqueIndex) => {
                                            return (
                                                index.name ===
                                                    uniqueIndex["INDEX_NAME"] &&
                                                index.synchronize === false
                                            )
                                        },
                                    )
                                })

                            const isConstraintComposite =
                                columnUniqueIndices.every((uniqueIndex) => {
                                    return dbIndices.some(
                                        (dbIndex) =>
                                            dbIndex["INDEX_NAME"] ===
                                                uniqueIndex["INDEX_NAME"] &&
                                            dbIndex["COLUMN_NAME"] !==
                                                dbColumn["COLUMN_NAME"],
                                    )
                                })

                            const tableColumn = new TableColumn()
                            tableColumn.name = dbColumn["COLUMN_NAME"]
                            tableColumn.type =
                                dbColumn["DATA_TYPE"].toLowerCase()

                            // since mysql 8.0, "geometrycollection" returned as "geomcollection"
                            // typeorm still use "geometrycollection"
                            if (tableColumn.type === "geomcollection") {
                                tableColumn.type = "geometrycollection"
                            }

                            tableColumn.zerofill =
                                dbColumn["COLUMN_TYPE"].includes("zerofill")
                            tableColumn.unsigned =
                                tableColumn.zerofill ||
                                dbColumn["COLUMN_TYPE"].includes("unsigned")
                            if (
                                this.driver.unsignedColumnTypes.includes(
                                    tableColumn.type as UnsignedColumnType,
                                )
                            ) {
                                const width = dbColumn["COLUMN_TYPE"].substring(
                                    dbColumn["COLUMN_TYPE"].indexOf("(") + 1,
                                    dbColumn["COLUMN_TYPE"].indexOf(")"),
                                )
                                tableColumn.width =
                                    width &&
                                    !this.isDefaultColumnWidth(
                                        table,
                                        tableColumn,
                                        parseInt(width),
                                    )
                                        ? parseInt(width)
                                        : undefined
                            }

                            if (
                                dbColumn["COLUMN_DEFAULT"] === null ||
                                dbColumn["COLUMN_DEFAULT"] === undefined ||
                                (isMariaDb &&
                                    dbColumn["COLUMN_DEFAULT"] === "NULL")
                            ) {
                                tableColumn.default = undefined
                            } else if (
                                /^CURRENT_TIMESTAMP(\([0-9]*\))?$/i.test(
                                    dbColumn["COLUMN_DEFAULT"],
                                )
                            ) {
                                // New versions of MariaDB return expressions in lowercase.  We need to set it in
                                // uppercase so the comparison in MysqlDriver#compareDefaultValues does not fail.
                                tableColumn.default =
                                    dbColumn["COLUMN_DEFAULT"].toUpperCase()
                            } else if (
                                isMariaDb &&
                                VersionUtils.isGreaterOrEqual(
                                    dbVersion,
                                    "10.2.7",
                                )
                            ) {
                                // MariaDB started adding quotes to literals in COLUMN_DEFAULT since version 10.2.7
                                // See https://mariadb.com/kb/en/library/information-schema-columns-table/
                                tableColumn.default = dbColumn["COLUMN_DEFAULT"]
                            } else {
                                tableColumn.default = `'${dbColumn["COLUMN_DEFAULT"]}'`
                            }

                            if (dbColumn["EXTRA"].indexOf("on update") !== -1) {
                                // New versions of MariaDB return expressions in lowercase.  We need to set it in
                                // uppercase so the comparison in MysqlDriver#compareExtraValues does not fail.
                                tableColumn.onUpdate = dbColumn["EXTRA"]
                                    .substring(
                                        dbColumn["EXTRA"].indexOf("on update") +
                                            10,
                                    )
                                    .toUpperCase()
                            }

                            if (dbColumn["GENERATION_EXPRESSION"]) {
                                tableColumn.generatedType =
                                    dbColumn["EXTRA"].indexOf("VIRTUAL") !== -1
                                        ? "VIRTUAL"
                                        : "STORED"

                                // We cannot relay on information_schema.columns.generation_expression, because it is formatted different.
                                const asExpressionQuery =
                                    this.selectTypeormMetadataSql({
                                        schema: dbTable["TABLE_SCHEMA"],
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

                            tableColumn.isUnique =
                                columnUniqueIndices.length > 0 &&
                                !hasIgnoredIndex &&
                                !isConstraintComposite

                            if (isMariaDb && tableColumn.generatedType) {
                                // do nothing - MariaDB does not support NULL/NOT NULL expressions for generated columns
                            } else {
                                tableColumn.isNullable =
                                    dbColumn["IS_NULLABLE"] === "YES"
                            }

                            tableColumn.isPrimary = dbPrimaryKeys.some(
                                (dbPrimaryKey) => {
                                    return (
                                        dbPrimaryKey["TABLE_NAME"] ===
                                            dbColumn["TABLE_NAME"] &&
                                        dbPrimaryKey["TABLE_SCHEMA"] ===
                                            dbColumn["TABLE_SCHEMA"] &&
                                        dbPrimaryKey["COLUMN_NAME"] ===
                                            dbColumn["COLUMN_NAME"]
                                    )
                                },
                            )
                            tableColumn.isGenerated =
                                dbColumn["EXTRA"].indexOf("auto_increment") !==
                                -1
                            if (tableColumn.isGenerated)
                                tableColumn.generationStrategy = "increment"

                            tableColumn.comment =
                                typeof dbColumn["COLUMN_COMMENT"] ===
                                    "string" &&
                                dbColumn["COLUMN_COMMENT"].length === 0
                                    ? undefined
                                    : dbColumn["COLUMN_COMMENT"]
                            if (dbColumn["CHARACTER_SET_NAME"])
                                tableColumn.charset =
                                    dbColumn["CHARACTER_SET_NAME"] ===
                                    defaultCharset
                                        ? undefined
                                        : dbColumn["CHARACTER_SET_NAME"]
                            if (dbColumn["COLLATION_NAME"])
                                tableColumn.collation =
                                    dbColumn["COLLATION_NAME"] ===
                                    defaultCollation
                                        ? undefined
                                        : dbColumn["COLLATION_NAME"]

                            // check only columns that have length property
                            if (
                                this.driver.withLengthColumnTypes.indexOf(
                                    tableColumn.type as ColumnType,
                                ) !== -1 &&
                                dbColumn["CHARACTER_MAXIMUM_LENGTH"]
                            ) {
                                let length: number =
                                    dbColumn["CHARACTER_MAXIMUM_LENGTH"]
                                if (tableColumn.type === "vector") {
                                    // MySQL and MariaDb store the vector length in bytes, not in number of dimensions.
                                    length = length / 4
                                }
                                tableColumn.length =
                                    !this.isDefaultColumnLength(
                                        table,
                                        tableColumn,
                                        length.toString(),
                                    )
                                        ? length.toString()
                                        : ""
                            }

                            if (
                                tableColumn.type === "decimal" ||
                                tableColumn.type === "double" ||
                                tableColumn.type === "float"
                            ) {
                                if (
                                    dbColumn["NUMERIC_PRECISION"] !== null &&
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["NUMERIC_PRECISION"],
                                    )
                                )
                                    tableColumn.precision = parseInt(
                                        dbColumn["NUMERIC_PRECISION"],
                                    )
                                if (
                                    dbColumn["NUMERIC_SCALE"] !== null &&
                                    !this.isDefaultColumnScale(
                                        table,
                                        tableColumn,
                                        dbColumn["NUMERIC_SCALE"],
                                    )
                                )
                                    tableColumn.scale = parseInt(
                                        dbColumn["NUMERIC_SCALE"],
                                    )
                            }

                            if (
                                tableColumn.type === "enum" ||
                                tableColumn.type === "simple-enum" ||
                                tableColumn.type === "set"
                            ) {
                                const colType = dbColumn["COLUMN_TYPE"]
                                const items = colType
                                    .substring(
                                        colType.indexOf("(") + 1,
                                        colType.lastIndexOf(")"),
                                    )
                                    .split(",")
                                tableColumn.enum = (items as string[]).map(
                                    (item) => {
                                        return item.substring(
                                            1,
                                            item.length - 1,
                                        )
                                    },
                                )
                                tableColumn.length = ""
                            }

                            if (
                                (tableColumn.type === "datetime" ||
                                    tableColumn.type === "time" ||
                                    tableColumn.type === "timestamp") &&
                                dbColumn["DATETIME_PRECISION"] !== null &&
                                dbColumn["DATETIME_PRECISION"] !== undefined &&
                                !this.isDefaultColumnPrecision(
                                    table,
                                    tableColumn,
                                    parseInt(dbColumn["DATETIME_PRECISION"]),
                                )
                            ) {
                                tableColumn.precision = parseInt(
                                    dbColumn["DATETIME_PRECISION"],
                                )
                            }

                            return tableColumn
                        }),
                )

                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils.uniq(
                    dbForeignKeys.filter((dbForeignKey) => {
                        return (
                            dbForeignKey["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbForeignKey["TABLE_SCHEMA"] ===
                                dbTable["TABLE_SCHEMA"]
                        )
                    }),
                    (dbForeignKey) => dbForeignKey["CONSTRAINT_NAME"],
                )

                table.foreignKeys = tableForeignKeyConstraints.map(
                    (dbForeignKey) => {
                        const foreignKeys = dbForeignKeys.filter(
                            (dbFk) =>
                                dbFk["CONSTRAINT_NAME"] ===
                                dbForeignKey["CONSTRAINT_NAME"],
                        )

                        // if referenced table located in currently used db, we don't need to concat db name to table name.
                        const database =
                            dbForeignKey["REFERENCED_TABLE_SCHEMA"] ===
                            currentDatabase
                                ? undefined
                                : dbForeignKey["REFERENCED_TABLE_SCHEMA"]
                        const referencedTableName = this.driver.buildTableName(
                            dbForeignKey["REFERENCED_TABLE_NAME"],
                            undefined,
                            database,
                        )

                        return new TableForeignKey({
                            name: dbForeignKey["CONSTRAINT_NAME"],
                            columnNames: foreignKeys.map(
                                (dbFk) => dbFk["COLUMN_NAME"],
                            ),
                            referencedDatabase:
                                dbForeignKey["REFERENCED_TABLE_SCHEMA"],
                            referencedTableName: referencedTableName,
                            referencedColumnNames: foreignKeys.map(
                                (dbFk) => dbFk["REFERENCED_COLUMN_NAME"],
                            ),
                            onDelete: dbForeignKey["ON_DELETE"],
                            onUpdate: dbForeignKey["ON_UPDATE"],
                        })
                    },
                )

                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils.uniq(
                    dbIndices.filter(
                        (dbIndex) =>
                            dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                            dbIndex["TABLE_SCHEMA"] === dbTable["TABLE_SCHEMA"],
                    ),
                    (dbIndex) => dbIndex["INDEX_NAME"],
                )

                table.indices = tableIndexConstraints.map((constraint) => {
                    const indices = dbIndices.filter((index) => {
                        return (
                            index["TABLE_SCHEMA"] ===
                                constraint["TABLE_SCHEMA"] &&
                            index["TABLE_NAME"] === constraint["TABLE_NAME"] &&
                            index["INDEX_NAME"] === constraint["INDEX_NAME"]
                        )
                    })

                    const nonUnique = parseInt(constraint["NON_UNIQUE"], 10)

                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map((i) => i["COLUMN_NAME"]),
                        isUnique: nonUnique === 0,
                        isSpatial: constraint["INDEX_TYPE"] === "SPATIAL",
                        isFulltext: constraint["INDEX_TYPE"] === "FULLTEXT",
                    })
                })

                table.comment = dbTable["TABLE_COMMENT"]

                return table
            }),
        )
    }

    /**
     * Builds create table sql
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const columnDefinitions = table.columns
            .map((column) => this.buildCreateColumnSql(column, true))
            .join(", ")
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`

        // we create unique indexes instead of unique constraints, because MySql does not have unique constraints.
        // if we mark column as Unique, it means that we create UNIQUE INDEX.
        table.columns
            .filter((column) => column.isUnique)
            .forEach((column) => {
                const isUniqueIndexExist = table.indices.some((index) => {
                    return (
                        index.columnNames.length === 1 &&
                        !!index.isUnique &&
                        index.columnNames.indexOf(column.name) !== -1
                    )
                })
                const isUniqueConstraintExist = table.uniques.some((unique) => {
                    return (
                        unique.columnNames.length === 1 &&
                        unique.columnNames.indexOf(column.name) !== -1
                    )
                })
                if (!isUniqueIndexExist && !isUniqueConstraintExist)
                    table.indices.push(
                        new TableIndex({
                            name: this.connection.namingStrategy.uniqueConstraintName(
                                table,
                                [column.name],
                            ),
                            columnNames: [column.name],
                            isUnique: true,
                        }),
                    )
            })

        // as MySql does not have unique constraints, we must create table indices from table uniques and mark them as unique.
        if (table.uniques.length > 0) {
            table.uniques.forEach((unique) => {
                const uniqueExist = table.indices.some(
                    (index) => index.name === unique.name,
                )
                if (!uniqueExist) {
                    table.indices.push(
                        new TableIndex({
                            name: unique.name,
                            columnNames: unique.columnNames,
                            isUnique: true,
                        }),
                    )
                }
            })
        }

        if (table.indices.length > 0) {
            const indicesSql = table.indices
                .map((index) => {
                    const columnNames = index.columnNames
                        .map((columnName) => `\`${columnName}\``)
                        .join(", ")
                    if (!index.name)
                        index.name = this.connection.namingStrategy.indexName(
                            table,
                            index.columnNames,
                            index.where,
                        )

                    let indexType = ""
                    if (index.isUnique) indexType += "UNIQUE "
                    if (index.isSpatial) indexType += "SPATIAL "
                    if (index.isFulltext) indexType += "FULLTEXT "
                    const indexParser =
                        index.isFulltext && index.parser
                            ? ` WITH PARSER ${index.parser}`
                            : ""

                    return `${indexType}INDEX \`${index.name}\` (${columnNames})${indexParser}`
                })
                .join(", ")

            sql += `, ${indicesSql}`
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys
                .map((fk) => {
                    const columnNames = fk.columnNames
                        .map((columnName) => `\`${columnName}\``)
                        .join(", ")
                    if (!fk.name)
                        fk.name = this.connection.namingStrategy.foreignKeyName(
                            table,
                            fk.columnNames,
                            this.getTablePath(fk),
                            fk.referencedColumnNames,
                        )
                    const referencedColumnNames = fk.referencedColumnNames
                        .map((columnName) => `\`${columnName}\``)
                        .join(", ")

                    let constraint = `CONSTRAINT \`${
                        fk.name
                    }\` FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(
                        this.getTablePath(fk),
                    )} (${referencedColumnNames})`
                    if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`
                    if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`

                    return constraint
                })
                .join(", ")

            sql += `, ${foreignKeysSql}`
        }

        if (table.primaryColumns.length > 0) {
            const columnNames = table.primaryColumns
                .map((column) => `\`${column.name}\``)
                .join(", ")
            sql += `, PRIMARY KEY (${columnNames})`
        }

        sql += `) ENGINE=${table.engine || "InnoDB"}`

        if (table.comment) {
            sql += ` COMMENT="${table.comment}"`
        }

        return new Query(sql)
    }

    /**
     * Builds drop table sql
     */
    protected dropTableSql(tableOrName: Table | string): Query {
        return new Query(`DROP TABLE ${this.escapePath(tableOrName)}`)
    }

    protected createViewSql(view: View): Query {
        if (typeof view.expression === "string") {
            return new Query(
                `CREATE VIEW ${this.escapePath(view)} AS ${view.expression}`,
            )
        } else {
            return new Query(
                `CREATE VIEW ${this.escapePath(view)} AS ${view
                    .expression(this.connection)
                    .getQuery()}`,
            )
        }
    }

    protected async insertViewDefinitionSql(view: View): Promise<Query> {
        const currentDatabase = await this.getCurrentDatabase()
        const expression =
            typeof view.expression === "string"
                ? view.expression.trim()
                : view.expression(this.connection).getQuery()
        return this.insertTypeormMetadataSql({
            type: MetadataTableType.VIEW,
            schema: currentDatabase,
            name: view.name,
            value: expression,
        })
    }

    /**
     * Builds drop view sql.
     */
    protected dropViewSql(viewOrPath: View | string): Query {
        return new Query(`DROP VIEW ${this.escapePath(viewOrPath)}`)
    }

    /**
     * Builds remove view sql.
     */
    protected async deleteViewDefinitionSql(
        viewOrPath: View | string,
    ): Promise<Query> {
        const currentDatabase = await this.getCurrentDatabase()
        const viewName = InstanceChecker.isView(viewOrPath)
            ? viewOrPath.name
            : viewOrPath
        return this.deleteTypeormMetadataSql({
            type: MetadataTableType.VIEW,
            schema: currentDatabase,
            name: viewName,
        })
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames
            .map((columnName) => `\`${columnName}\``)
            .join(", ")
        let indexType = ""
        if (index.isUnique) indexType += "UNIQUE "
        if (index.isSpatial) indexType += "SPATIAL "
        if (index.isFulltext) indexType += "FULLTEXT "
        const indexParser =
            index.isFulltext && index.parser
                ? ` WITH PARSER ${index.parser}`
                : ""

        return new Query(
            `CREATE ${indexType}INDEX \`${index.name}\` ON ${this.escapePath(
                table,
            )} (${columns})${indexParser}`,
        )
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(
        table: Table,
        indexOrName: TableIndex | string,
    ): Query {
        const indexName = InstanceChecker.isTableIndex(indexOrName)
            ? indexOrName.name
            : indexOrName
        return new Query(
            `DROP INDEX \`${indexName}\` ON ${this.escapePath(table)}`,
        )
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): Query {
        const columnNamesString = columnNames
            .map((columnName) => `\`${columnName}\``)
            .join(", ")
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} ADD PRIMARY KEY (${columnNamesString})`,
        )
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): Query {
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`,
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
            .map((column) => `\`${column}\``)
            .join(", ")
        const referencedColumnNames = foreignKey.referencedColumnNames
            .map((column) => `\`${column}\``)
            .join(",")
        let sql =
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT \`${
                foreignKey.name
            }\` FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(
                this.getTablePath(foreignKey),
            )}(${referencedColumnNames})`
        if (foreignKey.onDelete) sql += ` ON DELETE ${foreignKey.onDelete}`
        if (foreignKey.onUpdate) sql += ` ON UPDATE ${foreignKey.onUpdate}`

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
            )} DROP FOREIGN KEY \`${foreignKeyName}\``,
        )
    }

    /**
     * Escapes a given comment so it's safe to include in a query.
     */
    protected escapeComment(comment?: string) {
        if (!comment || comment.length === 0) {
            return `''`
        }

        comment = comment
            .replace(/\\/g, "\\\\") // MySQL allows escaping characters via backslashes
            .replace(/'/g, "''")
            .replace(/\u0000/g, "") // Null bytes aren't allowed in comments

        return `'${comment}'`
    }

    /**
     * Escapes given table or view path.
     */
    protected escapePath(target: Table | View | string): string {
        const { database, tableName } = this.driver.parseTableName(target)

        if (database && database !== this.driver.database) {
            return `\`${database}\`.\`${tableName}\``
        }

        return `\`${tableName}\``
    }

    /**
     * Builds a part of query to create/change a column.
     */
    protected buildCreateColumnSql(
        column: TableColumn,
        skipPrimary: boolean,
        skipName: boolean = false,
    ) {
        let c = ""
        if (skipName) {
            c = this.connection.driver.createFullType(column)
        } else {
            c = `\`${column.name}\` ${this.connection.driver.createFullType(
                column,
            )}`
        }

        if (column.charset) c += ` CHARACTER SET "${column.charset}"`
        if (column.collation) c += ` COLLATE "${column.collation}"`

        if (column.asExpression)
            c += ` AS (${column.asExpression}) ${
                column.generatedType ? column.generatedType : "VIRTUAL"
            }`

        // if you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to that column.
        if (column.zerofill) {
            c += " ZEROFILL"
        } else if (column.unsigned) {
            c += " UNSIGNED"
        }
        if (column.enum)
            c += ` (${column.enum
                .map((value) => "'" + value.replace(/'/g, "''") + "'")
                .join(", ")})`

        const isMariaDb = this.driver.options.type === "mariadb"
        if (
            isMariaDb &&
            column.asExpression &&
            ["VIRTUAL", "STORED"].includes(column.generatedType || "VIRTUAL")
        ) {
            // do nothing - MariaDB does not support NULL/NOT NULL expressions for VIRTUAL columns and STORED columns
        } else {
            if (!column.isNullable) c += " NOT NULL"
            if (column.isNullable) c += " NULL"
        }

        if (column.isPrimary && !skipPrimary) c += " PRIMARY KEY"
        if (column.isGenerated && column.generationStrategy === "increment")
            // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT"
        if (column.comment && column.comment.length > 0)
            c += ` COMMENT ${this.escapeComment(column.comment)}`
        if (column.default !== undefined && column.default !== null)
            c += ` DEFAULT ${column.default}`
        if (column.onUpdate) c += ` ON UPDATE ${column.onUpdate}`

        return c
    }

    async getVersion(): Promise<string> {
        const result: [{ version: string }] = await this.query(
            "SELECT version() as version",
        )

        // MariaDB: https://mariadb.com/kb/en/version/
        // - "10.2.27-MariaDB-10.2.27+maria~jessie-log"

        // MySQL: https://dev.mysql.com/doc/refman/8.4/en/information-functions.html#function_version
        // - "8.4.3"
        // - "8.4.4-standard"

        const versionString = result[0]["version"]

        return versionString.replace(/^([\d.]+).*$/, "$1")
    }

    /**
     * Checks if column display width is by default.
     * @deprecated MySQL no longer supports column width in newer versions.
     */
    protected isDefaultColumnWidth(
        table: Table,
        column: TableColumn,
        width: number,
    ): boolean {
        // Skip the whole check on servers that no longer expose width metadata.
        if (
            this.driver.options.type === "mysql" &&
            DriverUtils.isReleaseVersionOrGreater(this.driver, "8.0.0")
        ) {
            return true
        }

        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            const metadata = this.connection.getMetadata(table.name)
            const columnMetadata = metadata.findColumnWithDatabaseName(
                column.name,
            )
            if (columnMetadata && columnMetadata.width) return false
        }

        const defaultWidthForType =
            this.connection.driver.dataTypeDefaults &&
            this.connection.driver.dataTypeDefaults[column.type] &&
            this.connection.driver.dataTypeDefaults[column.type].width

        if (defaultWidthForType) {
            // In MariaDB & MySQL 5.7, the default widths of certain numeric types are 1 less than
            // the usual defaults when the column is unsigned.
            const typesWithReducedUnsignedDefault = [
                "int",
                "tinyint",
                "smallint",
                "mediumint",
            ]
            const needsAdjustment =
                typesWithReducedUnsignedDefault.indexOf(column.type) !== -1
            if (column.unsigned && needsAdjustment) {
                return defaultWidthForType - 1 === width
            } else {
                return defaultWidthForType === width
            }
        }

        return false
    }
}
