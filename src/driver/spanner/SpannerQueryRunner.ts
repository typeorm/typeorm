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
import { OrmUtils } from "../../util/OrmUtils"
import { Query } from "../Query"
import { ColumnType } from "../types/ColumnTypes"
import { IsolationLevel } from "../types/IsolationLevel"
import { MetadataTableType } from "../types/MetadataTableType"
import { ReplicationMode } from "../types/ReplicationMode"
import { SpannerDriver } from "./SpannerDriver"

/**
 * Runs queries on a single postgres database connection.
 */
export class SpannerQueryRunner extends BaseQueryRunner implements QueryRunner {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: SpannerDriver

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected session?: any

    /**
     * Transaction currently executed by this session.
     */
    protected sessionTransaction?: any

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SpannerDriver, mode: ReplicationMode) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.mode = mode
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
        if (this.session) {
            return Promise.resolve(this.session)
        }

        const [session] = await this.driver.instanceDatabase.createSession({})
        this.session = session
        this.sessionTransaction = await session.transaction()
        return this.session
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    async release(): Promise<void> {
        this.isReleased = true
        if (this.session) {
            await this.session.delete()
        }
        this.session = undefined
        return Promise.resolve()
    }

    /**
     * Starts transaction.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        await this.connect()
        await this.sessionTransaction.begin()
        this.connection.logger.logQuery("START TRANSACTION")

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive || !this.sessionTransaction)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        await this.sessionTransaction.commit()
        this.connection.logger.logQuery("COMMIT")
        this.isTransactionActive = false

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive || !this.sessionTransaction)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        await this.sessionTransaction.rollback()
        this.connection.logger.logQuery("ROLLBACK")
        this.isTransactionActive = false

        await this.broadcaster.broadcast("AfterTransactionRollback")
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult: boolean = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        await this.connect()

        this.driver.connection.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()

        try {
            const queryStartTime = Date.now()
            let rawResult:
                | [
                      any[],
                      {
                          queryPlan: null
                          queryStats: null
                          rowCountExact: string
                          rowCount: string
                      },
                      { rowType: { fields: [] }; transaction: null },
                  ]
                | undefined = undefined
            const isSelect = query.startsWith("SELECT")
            const executor =
                isSelect && !this.isTransactionActive
                    ? this.driver.instanceDatabase
                    : this.sessionTransaction

            if (!this.isTransactionActive && !isSelect) {
                await this.sessionTransaction.begin()
            }

            try {
                rawResult = await executor.run({
                    sql: query,
                    params: parameters
                        ? parameters.reduce((params, value, index) => {
                              params["param" + index] = value
                              return params
                          }, {} as ObjectLiteral)
                        : undefined,
                    json: true,
                })
                if (!this.isTransactionActive && !isSelect) {
                    await this.sessionTransaction.commit()
                }
            } catch (error) {
                try {
                    // we throw original error even if rollback thrown an error
                    if (!this.isTransactionActive && !isSelect)
                        await this.sessionTransaction.rollback()
                } catch (rollbackError) {}
                throw error
            }

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
                rawResult,
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

            result.raw = rawResult
            result.records = rawResult ? rawResult[0] : []
            if (rawResult && rawResult[1] && rawResult[1].rowCountExact) {
                result.affected = parseInt(rawResult[1].rowCountExact)
            }

            if (!useStructuredResult) {
                return result.records
            }

            return result
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
     * Update database schema.
     * Used for creating/altering/dropping tables, columns, indexes, etc.
     *
     * DDL changing queries should be executed by `updateSchema()` method.
     */
    async updateDDL(query: string, parameters?: any[]): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        this.driver.connection.logger.logQuery(query, parameters, this)
        try {
            const queryStartTime = Date.now()
            const [operation] =
                await this.driver.instanceDatabase.updateSchema(query)
            await operation.promise()
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
     * Returns raw data stream.
     */
    async stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<ReadStream> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        try {
            this.driver.connection.logger.logQuery(query, parameters, this)
            const request = {
                sql: query,
                params: parameters
                    ? parameters.reduce((params, value, index) => {
                          params["param" + index] = value
                          return params
                      }, {} as ObjectLiteral)
                    : undefined,
                json: true,
            }
            const stream = this.driver.instanceDatabase.runStream(request)

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
        throw new TypeORMError(
            `Check database queries are not supported by Spanner driver.`,
        )
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        throw new TypeORMError(
            `Check database queries are not supported by Spanner driver.`,
        )
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(
            `SELECT * FROM "information_schema"."schemata" WHERE "schema_name" = '${schema}'`,
        )
        return result.length ? true : false
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<string> {
        throw new TypeORMError(
            `Check schema queries are not supported by Spanner driver.`,
        )
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const tableName =
            tableOrName instanceof Table ? tableOrName.name : tableOrName
        const sql =
            `SELECT * FROM \`INFORMATION_SCHEMA\`.\`TABLES\` ` +
            `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`TABLE_TYPE\` = 'BASE TABLE' ` +
            `AND \`TABLE_NAME\` = '${tableName}'`
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
        const tableName =
            tableOrName instanceof Table ? tableOrName.name : tableOrName
        const sql =
            `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` ` +
            `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' ` +
            `AND \`TABLE_NAME\` = '${tableName}' AND \`COLUMN_NAME\` = '${columnName}'`
        const result = await this.query(sql)
        return result.length ? true : false
    }

    /**
     * Creates a new database.
     * Note: Spanner does not support database creation inside a transaction block.
     */
    async createDatabase(
        database: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        if (ifNotExist) {
            const databaseAlreadyExists = await this.hasDatabase(database)

            if (databaseAlreadyExists) return Promise.resolve()
        }

        const up = `CREATE DATABASE "${database}"`
        const down = `DROP DATABASE "${database}"`
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Drops database.
     * Note: Spanner does not support database dropping inside a transaction block.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist
            ? `DROP DATABASE IF EXISTS "${database}"`
            : `DROP DATABASE "${database}"`
        const down = `CREATE DATABASE "${database}"`
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(
        schemaPath: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Drops table schema.
     */
    async dropSchema(
        schemaPath: string,
        ifExist?: boolean,
        isCascade?: boolean,
    ): Promise<void> {
        return Promise.resolve()
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
                downQueries.push(this.dropIndexSql(table, index))
            })
        }

        // if table has column with generated type, we must add the expression to the metadata table
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
        target: Table | string,
        ifExist?: boolean,
        dropForeignKeys: boolean = true,
        dropIndices: boolean = true,
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

        if (dropIndices) {
            table.indices.forEach((index) => {
                upQueries.push(this.dropIndexSql(table, index))
                downQueries.push(this.createIndexSql(table, index))
            })
        }

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
    async createView(view: View): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []
        upQueries.push(this.createViewSql(view))
        upQueries.push(await this.insertViewDefinitionSql(view))
        downQueries.push(this.dropViewSql(view))
        downQueries.push(await this.deleteViewDefinitionSql(view))
        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drops the view.
     */
    async dropView(target: View | string): Promise<void> {
        const viewName = target instanceof View ? target.name : target
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
     * Renames the given table.
     */
    async renameTable(
        oldTableOrName: Table | string,
        newTableName: string,
    ): Promise<void> {
        throw new TypeORMError(
            `Rename table queries are not supported by Spanner driver.`,
        )
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(
        tableOrName: Table | string,
        column: TableColumn,
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
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
                `ALTER TABLE ${this.escapePath(
                    table,
                )} DROP COLUMN ${this.driver.escape(column.name)}`,
            ),
        )

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

            upQueries.push(this.createIndexSql(table, uniqueIndex))
            downQueries.push(this.dropIndexSql(table, uniqueIndex))
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        const oldColumn =
            oldTableColumnOrName instanceof TableColumn
                ? oldTableColumnOrName
                : table.columns.find((c) => c.name === oldTableColumnOrName)
        if (!oldColumn)
            throw new TypeORMError(
                `Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`,
            )

        let newColumn
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName
        } else {
            newColumn = oldColumn.clone()
            newColumn.name = newTableColumnOrName
        }

        return this.changeColumn(table, oldColumn, newColumn)
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newColumn: TableColumn,
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        let clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        const oldColumn =
            oldTableColumnOrName instanceof TableColumn
                ? oldTableColumnOrName
                : table.columns.find(
                      (column) => column.name === oldTableColumnOrName,
                  )
        if (!oldColumn)
            throw new TypeORMError(
                `Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`,
            )

        if (
            oldColumn.name !== newColumn.name ||
            oldColumn.type !== newColumn.type ||
            oldColumn.length !== newColumn.length ||
            oldColumn.isArray !== newColumn.isArray ||
            oldColumn.generatedType !== newColumn.generatedType ||
            oldColumn.asExpression !== newColumn.asExpression
        ) {
            // To avoid data conversion, we just recreate column
            await this.dropColumn(table, oldColumn)
            await this.addColumn(table, newColumn)

            // update cloned table
            clonedTable = table.clone()
        } else {
            if (
                newColumn.precision !== oldColumn.precision ||
                newColumn.scale !== oldColumn.scale
            ) {
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${this.driver.createFullType(newColumn)}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${this.driver.createFullType(oldColumn)}`,
                    ),
                )
            }

            if (oldColumn.isNullable !== newColumn.isNullable) {
                if (newColumn.isNullable) {
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`,
                        ),
                    )
                } else {
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`,
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

                    upQueries.push(this.createIndexSql(table, uniqueIndex))
                    downQueries.push(this.dropIndexSql(table, uniqueIndex))
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

                    upQueries.push(this.dropIndexSql(table, uniqueIndex!))
                    downQueries.push(this.createIndexSql(table, uniqueIndex!))
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        const column =
            columnOrName instanceof TableColumn
                ? columnOrName
                : table.findColumnByName(columnOrName)
        if (!column)
            throw new TypeORMError(
                `Column "${columnOrName}" was not found in table "${table.name}"`,
            )

        const clonedTable = table.clone()
        const upQueries: Query[] = []
        const downQueries: Query[] = []

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

        upQueries.push(
            new Query(
                `ALTER TABLE ${this.escapePath(
                    table,
                )} DROP COLUMN ${this.driver.escape(column.name)}`,
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
     *
     * Not supported in Spanner.
     * @see https://cloud.google.com/spanner/docs/schema-and-data-model#notes_about_key_columns
     */
    async createPrimaryKey(
        tableOrName: Table | string,
        columnNames: string[],
    ): Promise<void> {
        throw new Error(
            "The keys of a table can't change; you can't add a key column to an existing table or remove a key column from an existing table.",
        )
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        throw new Error(
            "The keys of a table can't change; you can't add a key column to an existing table or remove a key column from an existing table.",
        )
    }

    /**
     * Creates a new primary key.
     *
     * Not supported in Spanner.
     * @see https://cloud.google.com/spanner/docs/schema-and-data-model#notes_about_key_columns
     */
    async dropPrimaryKey(tableOrName: Table | string): Promise<void> {
        throw new Error(
            "The keys of a table can't change; you can't add a key column to an existing table or remove a key column from an existing table.",
        )
    }

    /**
     * Creates new unique constraint.
     */
    async createUniqueConstraint(
        tableOrName: Table | string,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Creates new unique constraints.
     */
    async createUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Drops unique constraint.
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Drops unique constraints.
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support unique constraints. Use unique index instead.`,
        )
    }

    /**
     * Creates a new check constraint.
     */
    async createCheckConstraint(
        tableOrName: Table | string,
        checkConstraint: TableCheck,
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)

        // new check constraint may be passed without name. In this case we generate unique name manually.
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        const checkConstraint =
            checkOrName instanceof TableCheck
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
     * Creates new exclusion constraint.
     */
    async createExclusionConstraint(
        tableOrName: Table | string,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support exclusion constraints.`,
        )
    }

    /**
     * Creates new exclusion constraints.
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support exclusion constraints.`,
        )
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(
        tableOrName: Table | string,
        exclusionOrName: TableExclusion | string,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support exclusion constraints.`,
        )
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner does not support exclusion constraints.`,
        )
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(
        tableOrName: Table | string,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        const foreignKey =
            foreignKeyOrName instanceof TableForeignKey
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
        for (const foreignKey of [...foreignKeys]) {
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name) index.name = this.generateIndexName(table, index)

        const up = this.createIndexSql(table, index)
        const down = this.dropIndexSql(table, index)
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
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)
        const index =
            indexOrName instanceof TableIndex
                ? indexOrName
                : table.indices.find((i) => i.name === indexOrName)
        if (!index)
            throw new TypeORMError(
                `Supplied index ${indexOrName} was not found in table ${table.name}`,
            )

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name) index.name = this.generateIndexName(table, index)

        const up = this.dropIndexSql(table, index)
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
        for (const index of [...indices]) {
            await this.dropIndex(tableOrName, index)
        }
    }

    /**
     * Clears all table contents.
     * Spanner does not support TRUNCATE TABLE statement, so we use DELETE FROM.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`DELETE FROM ${this.escapePath(tableName)} WHERE true`)
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        // drop index queries
        const selectIndexDropsQuery =
            `SELECT concat('DROP INDEX \`', INDEX_NAME, '\`') AS \`query\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`INDEXES\` ` +
            `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`INDEX_TYPE\` = 'INDEX' AND \`SPANNER_IS_MANAGED\` = false`
        const dropIndexQueries: ObjectLiteral[] = await this.query(
            selectIndexDropsQuery,
        )

        // drop foreign key queries
        const selectFKDropsQuery =
            `SELECT concat('ALTER TABLE \`', TABLE_NAME, '\`', ' DROP CONSTRAINT \`', CONSTRAINT_NAME, '\`') AS \`query\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`TABLE_CONSTRAINTS\` ` +
            `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`CONSTRAINT_TYPE\` = 'FOREIGN KEY'`
        const dropFKQueries: ObjectLiteral[] =
            await this.query(selectFKDropsQuery)

        // drop view queries
        // const selectViewDropsQuery = `SELECT concat('DROP VIEW \`', TABLE_NAME, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`VIEWS\``
        // const dropViewQueries: ObjectLiteral[] = await this.query(
        //     selectViewDropsQuery,
        // )

        // drop table queries
        const dropTablesQuery =
            `SELECT concat('DROP TABLE \`', TABLE_NAME, '\`') AS \`query\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`TABLES\` ` +
            `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`TABLE_TYPE\` = 'BASE TABLE'`
        const dropTableQueries: ObjectLiteral[] =
            await this.query(dropTablesQuery)

        if (
            !dropIndexQueries.length &&
            !dropFKQueries.length &&
            // !dropViewQueries.length &&
            !dropTableQueries.length
        )
            return

        const isAnotherTransactionActive = this.isTransactionActive
        if (!isAnotherTransactionActive) await this.startTransaction()
        try {
            for (const query of dropIndexQueries) {
                await this.updateDDL(query["query"])
            }
            for (const query of dropFKQueries) {
                await this.updateDDL(query["query"])
            }

            // for (let query of dropViewQueries) {
            //     await this.updateDDL(query["query"])
            // }

            for (const query of dropTableQueries) {
                await this.updateDDL(query["query"])
            }

            await this.commitTransaction()
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
    // Override Methods
    // -------------------------------------------------------------------------

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql(): Promise<void> {
        for (const { query, parameters } of this.sqlInMemory.upQueries) {
            if (this.isDMLQuery(query)) {
                await this.query(query, parameters)
            } else {
                await this.updateDDL(query, parameters)
            }
        }
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql(): Promise<void> {
        for (const {
            query,
            parameters,
        } of this.sqlInMemory.downQueries.reverse()) {
            if (this.isDMLQuery(query)) {
                await this.query(query, parameters)
            } else {
                await this.updateDDL(query, parameters)
            }
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async loadViews(viewNames?: string[]): Promise<View[]> {
        // const hasTable = await this.hasTable(this.getTypeormMetadataTableName())
        // if (!hasTable) {
        //     return []
        // }
        //
        // if (!viewNames) {
        //     viewNames = []
        // }
        //
        // const escapedViewNames = viewNames
        //     .map((viewName) => `'${viewName}'`)
        //     .join(", ")
        //
        // const query =
        //     `SELECT \`T\`.*, \`V\`.\`VIEW_DEFINITION\` FROM ${this.escapePath(
        //         this.getTypeormMetadataTableName(),
        //     )} \`T\` ` +
        //     `INNER JOIN \`INFORMATION_SCHEMA\`.\`VIEWS\` \`V\` ON \`V\`.\`TABLE_NAME\` = \`T\`.\`NAME\` ` +
        //     `WHERE \`T\`.\`TYPE\` = '${MetadataTableType.VIEW}' ${
        //         viewNames.length
        //             ? ` AND \`T\`.\`NAME\` IN (${escapedViewNames})`
        //             : ""
        //     }`
        // const dbViews = await this.query(query)
        // return dbViews.map((dbView: any) => {
        //     const view = new View()
        //     view.database = dbView["NAME"]
        //     view.name = this.driver.buildTableName(dbView["NAME"])
        //     view.expression = dbView["NAME"]
        //     return view
        // })

        return Promise.resolve([])
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        if (tableNames && tableNames.length === 0) {
            return []
        }

        const dbTables: { TABLE_NAME: string }[] = []

        if (!tableNames || !tableNames.length) {
            // Since we don't have any of this data we have to do a scan
            const tablesSql =
                `SELECT \`TABLE_NAME\` ` +
                `FROM \`INFORMATION_SCHEMA\`.\`TABLES\` ` +
                `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`TABLE_TYPE\` = 'BASE TABLE'`
            dbTables.push(...(await this.query(tablesSql)))
        } else {
            const tablesSql =
                `SELECT \`TABLE_NAME\` ` +
                `FROM \`INFORMATION_SCHEMA\`.\`TABLES\` ` +
                `WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`TABLE_TYPE\` = 'BASE TABLE' ` +
                `AND \`TABLE_NAME\` IN (${tableNames
                    .map((tableName) => `'${tableName}'`)
                    .join(", ")})`

            dbTables.push(...(await this.query(tablesSql)))
        }

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length) return []

        const loadedTableNames = dbTables
            .map((dbTable) => `'${dbTable.TABLE_NAME}'`)
            .join(", ")

        const columnsSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_CATALOG\` = '' AND \`TABLE_SCHEMA\` = '' AND \`TABLE_NAME\` IN (${loadedTableNames})`

        const primaryKeySql =
            `SELECT \`KCU\`.\`TABLE_NAME\`, \`KCU\`.\`COLUMN_NAME\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`TABLE_CONSTRAINTS\` \`TC\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`KCU\` ON \`KCU\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `WHERE \`TC\`.\`TABLE_CATALOG\` = '' AND \`TC\`.\`TABLE_SCHEMA\` = '' AND \`TC\`.\`CONSTRAINT_TYPE\` = 'PRIMARY KEY' ` +
            `AND \`TC\`.\`TABLE_NAME\` IN (${loadedTableNames})`

        const indicesSql =
            `SELECT \`I\`.\`TABLE_NAME\`, \`I\`.\`INDEX_NAME\`, \`I\`.\`IS_UNIQUE\`, \`I\`.\`IS_NULL_FILTERED\`, \`IC\`.\`COLUMN_NAME\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`INDEXES\` \`I\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`INDEX_COLUMNS\` \`IC\` ON \`IC\`.\`INDEX_NAME\` = \`I\`.\`INDEX_NAME\` ` +
            `AND \`IC\`.\`TABLE_NAME\` = \`I\`.\`TABLE_NAME\` ` +
            `WHERE \`I\`.\`TABLE_CATALOG\` = '' AND \`I\`.\`TABLE_SCHEMA\` = '' AND \`I\`.\`TABLE_NAME\` IN (${loadedTableNames}) ` +
            `AND \`I\`.\`INDEX_TYPE\` = 'INDEX' AND \`I\`.\`SPANNER_IS_MANAGED\` = false`

        const checksSql =
            `SELECT \`TC\`.\`TABLE_NAME\`, \`TC\`.\`CONSTRAINT_NAME\`, \`CC\`.\`CHECK_CLAUSE\`, \`CCU\`.\`COLUMN_NAME\`` +
            `FROM \`INFORMATION_SCHEMA\`.\`TABLE_CONSTRAINTS\` \`TC\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`CONSTRAINT_COLUMN_USAGE\` \`CCU\` ON \`CCU\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`CHECK_CONSTRAINTS\` \`CC\` ON \`CC\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `WHERE \`TC\`.\`TABLE_CATALOG\` = '' AND \`TC\`.\`TABLE_SCHEMA\` = '' AND \`TC\`.\`CONSTRAINT_TYPE\` = 'CHECK' ` +
            `AND \`TC\`.\`TABLE_NAME\` IN (${loadedTableNames}) AND \`TC\`.\`CONSTRAINT_NAME\` NOT LIKE 'CK_IS_NOT_NULL%'`

        const foreignKeysSql =
            `SELECT \`TC\`.\`TABLE_NAME\`, \`TC\`.\`CONSTRAINT_NAME\`, \`KCU\`.\`COLUMN_NAME\`, ` +
            `\`CTU\`.\`TABLE_NAME\` AS \`REFERENCED_TABLE_NAME\`, \`CCU\`.\`COLUMN_NAME\` AS \`REFERENCED_COLUMN_NAME\`, ` +
            `\`RC\`.\`UPDATE_RULE\`, \`RC\`.\`DELETE_RULE\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`TABLE_CONSTRAINTS\` \`TC\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`KCU\` ON \`KCU\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`CONSTRAINT_TABLE_USAGE\` \`CTU\` ON \`CTU\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`RC\` ON \`RC\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`CONSTRAINT_COLUMN_USAGE\` \`CCU\` ON \`CCU\`.\`CONSTRAINT_NAME\` = \`TC\`.\`CONSTRAINT_NAME\` ` +
            `WHERE \`TC\`.\`TABLE_CATALOG\` = '' AND \`TC\`.\`TABLE_SCHEMA\` = '' AND \`TC\`.\`CONSTRAINT_TYPE\` = 'FOREIGN KEY' ` +
            `AND \`TC\`.\`TABLE_NAME\` IN (${loadedTableNames})`

        const [
            dbColumns,
            dbPrimaryKeys,
            dbIndices,
            dbChecks,
            dbForeignKeys,
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(primaryKeySql),
            this.query(indicesSql),
            this.query(checksSql),
            this.query(foreignKeysSql),
        ])

        // create tables for loaded tables
        return Promise.all(
            dbTables.map(async (dbTable) => {
                const table = new Table()

                table.name = this.driver.buildTableName(dbTable["TABLE_NAME"])

                // create columns from the loaded columns
                table.columns = await Promise.all(
                    dbColumns
                        .filter(
                            (dbColumn) =>
                                dbColumn["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"],
                        )
                        .map(async (dbColumn) => {
                            const columnUniqueIndices = dbIndices.filter(
                                (dbIndex) => {
                                    return (
                                        dbIndex["TABLE_NAME"] ===
                                            dbTable["TABLE_NAME"] &&
                                        dbIndex["COLUMN_NAME"] ===
                                            dbColumn["COLUMN_NAME"] &&
                                        dbIndex["IS_UNIQUE"] === true
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

                            let fullType =
                                dbColumn["SPANNER_TYPE"].toLowerCase()
                            if (fullType.indexOf("array") !== -1) {
                                tableColumn.isArray = true
                                fullType = fullType.substring(
                                    fullType.indexOf("<") + 1,
                                    fullType.indexOf(">"),
                                )
                            }

                            if (fullType.indexOf("(") !== -1) {
                                tableColumn.type = fullType.substring(
                                    0,
                                    fullType.indexOf("("),
                                )
                            } else {
                                tableColumn.type = fullType
                            }

                            if (
                                this.driver.withLengthColumnTypes.indexOf(
                                    tableColumn.type as ColumnType,
                                ) !== -1
                            ) {
                                tableColumn.length = fullType.substring(
                                    fullType.indexOf("(") + 1,
                                    fullType.indexOf(")"),
                                )
                            }

                            if (dbColumn["IS_GENERATED"] === "ALWAYS") {
                                tableColumn.asExpression =
                                    dbColumn["GENERATION_EXPRESSION"]
                                tableColumn.generatedType = "STORED"

                                // We cannot relay on information_schema.columns.generation_expression, because it is formatted different.
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

                            tableColumn.isUnique =
                                columnUniqueIndices.length > 0 &&
                                !hasIgnoredIndex &&
                                !isConstraintComposite
                            tableColumn.isNullable =
                                dbColumn["IS_NULLABLE"] === "YES"
                            tableColumn.isPrimary = dbPrimaryKeys.some(
                                (dbPrimaryKey) => {
                                    return (
                                        dbPrimaryKey["TABLE_NAME"] ===
                                            dbColumn["TABLE_NAME"] &&
                                        dbPrimaryKey["COLUMN_NAME"] ===
                                            dbColumn["COLUMN_NAME"]
                                    )
                                },
                            )

                            return tableColumn
                        }),
                )

                const tableForeignKeys = dbForeignKeys.filter(
                    (dbForeignKey) => {
                        return (
                            dbForeignKey["TABLE_NAME"] === dbTable["TABLE_NAME"]
                        )
                    },
                )

                table.foreignKeys = OrmUtils.uniq(
                    tableForeignKeys,
                    (dbForeignKey) => dbForeignKey["CONSTRAINT_NAME"],
                ).map((dbForeignKey) => {
                    const foreignKeys = tableForeignKeys.filter(
                        (dbFk) =>
                            dbFk["CONSTRAINT_NAME"] ===
                            dbForeignKey["CONSTRAINT_NAME"],
                    )
                    return new TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: OrmUtils.uniq(
                            foreignKeys.map((dbFk) => dbFk["COLUMN_NAME"]),
                        ),
                        referencedDatabase:
                            dbForeignKey["REFERENCED_TABLE_SCHEMA"],
                        referencedTableName:
                            dbForeignKey["REFERENCED_TABLE_NAME"],
                        referencedColumnNames: OrmUtils.uniq(
                            foreignKeys.map(
                                (dbFk) => dbFk["REFERENCED_COLUMN_NAME"],
                            ),
                        ),
                        onDelete: dbForeignKey["DELETE_RULE"],
                        onUpdate: dbForeignKey["UPDATE_RULE"],
                    })
                })

                const tableIndices = dbIndices.filter(
                    (dbIndex) =>
                        dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"],
                )

                table.indices = OrmUtils.uniq(
                    tableIndices,
                    (dbIndex) => dbIndex["INDEX_NAME"],
                ).map((constraint) => {
                    const indices = tableIndices.filter((index) => {
                        return index["INDEX_NAME"] === constraint["INDEX_NAME"]
                    })

                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map((i) => i["COLUMN_NAME"]),
                        isUnique: constraint["IS_UNIQUE"],
                        isNullFiltered: constraint["IS_NULL_FILTERED"],
                    })
                })

                const tableChecks = dbChecks.filter(
                    (dbCheck) =>
                        dbCheck["TABLE_NAME"] === dbTable["TABLE_NAME"],
                )

                table.checks = OrmUtils.uniq(
                    tableChecks,
                    (dbIndex) => dbIndex["CONSTRAINT_NAME"],
                ).map((constraint) => {
                    const checks = tableChecks.filter(
                        (dbC) =>
                            dbC["CONSTRAINT_NAME"] ===
                            constraint["CONSTRAINT_NAME"],
                    )
                    return new TableCheck({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: checks.map((c) => c["COLUMN_NAME"]),
                        expression: constraint["CHECK_CLAUSE"],
                    })
                })

                return table
            }),
        )
    }

    /**
     * Builds create table sql.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const columnDefinitions = table.columns
            .map((column) => this.buildCreateColumnSql(column))
            .join(", ")
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`

        // we create unique indexes instead of unique constraints, because Spanner does not have unique constraints.
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

        // as Spanner does not have unique constraints, we must create table indices from table uniques and mark them as unique.
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

        if (table.checks.length > 0) {
            const checksSql = table.checks
                .map((check) => {
                    const checkName = check.name
                        ? check.name
                        : this.connection.namingStrategy.checkConstraintName(
                              table,
                              check.expression!,
                          )
                    return `CONSTRAINT \`${checkName}\` CHECK (${check.expression})`
                })
                .join(", ")

            sql += `, ${checksSql}`
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

                    return `CONSTRAINT \`${
                        fk.name
                    }\` FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(
                        this.getTablePath(fk),
                    )} (${referencedColumnNames})`
                })
                .join(", ")

            sql += `, ${foreignKeysSql}`
        }

        sql += `)`

        const primaryColumns = table.columns.filter(
            (column) => column.isPrimary,
        )
        if (primaryColumns.length > 0) {
            const columnNames = primaryColumns
                .map((column) => this.driver.escape(column.name))
                .join(", ")
            sql += ` PRIMARY KEY (${columnNames})`
        }

        return new Query(sql)
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(tableOrPath: Table | string): Query {
        return new Query(`DROP TABLE ${this.escapePath(tableOrPath)}`)
    }

    protected createViewSql(view: View): Query {
        const materializedClause = view.materialized ? "MATERIALIZED " : ""
        const viewName = this.escapePath(view)

        const expression =
            typeof view.expression === "string"
                ? view.expression
                : view.expression(this.connection).getQuery()
        return new Query(
            `CREATE ${materializedClause}VIEW ${viewName} SQL SECURITY INVOKER AS ${expression}`,
        )
    }

    protected async insertViewDefinitionSql(view: View): Promise<Query> {
        const { schema, tableName: name } = this.driver.parseTableName(view)

        const type = view.materialized
            ? MetadataTableType.MATERIALIZED_VIEW
            : MetadataTableType.VIEW
        const expression =
            typeof view.expression === "string"
                ? view.expression.trim()
                : view.expression(this.connection).getQuery()
        return this.insertTypeormMetadataSql({
            type,
            schema,
            name,
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
    protected async deleteViewDefinitionSql(view: View): Promise<Query> {
        const { schema, tableName: name } = this.driver.parseTableName(view)

        const type = view.materialized
            ? MetadataTableType.MATERIALIZED_VIEW
            : MetadataTableType.VIEW
        return this.deleteTypeormMetadataSql({ type, schema, name })
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames
            .map((columnName) => this.driver.escape(columnName))
            .join(", ")
        let indexType = ""
        if (index.isUnique) indexType += "UNIQUE "
        if (index.isNullFiltered) indexType += "NULL_FILTERED "

        return new Query(
            `CREATE ${indexType}INDEX \`${index.name}\` ON ${this.escapePath(
                table,
            )} (${columns})`,
        )
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(
        table: Table,
        indexOrName: TableIndex | string,
    ): Query {
        const indexName =
            indexOrName instanceof TableIndex ? indexOrName.name : indexOrName
        return new Query(`DROP INDEX \`${indexName}\``)
    }

    /**
     * Builds create check constraint sql.
     */
    protected createCheckConstraintSql(
        table: Table,
        checkConstraint: TableCheck,
    ): Query {
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT \`${
                checkConstraint.name
            }\` CHECK (${checkConstraint.expression})`,
        )
    }

    /**
     * Builds drop check constraint sql.
     */
    protected dropCheckConstraintSql(
        table: Table,
        checkOrName: TableCheck | string,
    ): Query {
        const checkName =
            checkOrName instanceof TableCheck ? checkOrName.name : checkOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT \`${checkName}\``,
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
            .map((column) => this.driver.escape(column))
            .join(", ")
        const referencedColumnNames = foreignKey.referencedColumnNames
            .map((column) => this.driver.escape(column))
            .join(",")
        const sql =
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT \`${
                foreignKey.name
            }\` FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(
                this.getTablePath(foreignKey),
            )} (${referencedColumnNames})`

        return new Query(sql)
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(
        table: Table,
        foreignKeyOrName: TableForeignKey | string,
    ): Query {
        const foreignKeyName =
            foreignKeyOrName instanceof TableForeignKey
                ? foreignKeyOrName.name
                : foreignKeyOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(
                table,
            )} DROP CONSTRAINT \`${foreignKeyName}\``,
        )
    }

    /**
     * Escapes given table or view path.
     */
    protected escapePath(target: Table | View | string): string {
        const { tableName } = this.driver.parseTableName(target)
        return `\`${tableName}\``
    }

    /**
     * Builds a part of query to create/change a column.
     */
    protected buildCreateColumnSql(column: TableColumn) {
        let c = `${this.driver.escape(
            column.name,
        )} ${this.connection.driver.createFullType(column)}`

        // Spanner supports only STORED generated column type
        if (column.generatedType === "STORED" && column.asExpression) {
            c += ` AS (${column.asExpression}) STORED`
        } else {
            if (!column.isNullable) c += " NOT NULL"
        }

        return c
    }

    /**
     * Executes sql used special for schema build.
     */
    protected async executeQueries(
        upQueries: Query | Query[],
        downQueries: Query | Query[],
    ): Promise<void> {
        if (upQueries instanceof Query) upQueries = [upQueries]
        if (downQueries instanceof Query) downQueries = [downQueries]

        this.sqlInMemory.upQueries.push(...upQueries)
        this.sqlInMemory.downQueries.push(...downQueries)

        // if sql-in-memory mode is enabled then simply store sql in memory and return
        if (this.sqlMemoryMode === true)
            return Promise.resolve() as Promise<any>

        for (const { query, parameters } of upQueries) {
            if (this.isDMLQuery(query)) {
                await this.query(query, parameters)
            } else {
                await this.updateDDL(query, parameters)
            }
        }
    }

    protected isDMLQuery(query: string): boolean {
        return (
            query.startsWith("INSERT") ||
            query.startsWith("UPDATE") ||
            query.startsWith("DELETE")
        )
    }

    /**
     * Change table comment.
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `spanner driver does not support change table comment.`,
        )
    }
}
