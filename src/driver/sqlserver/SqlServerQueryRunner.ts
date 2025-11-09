import { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { ReadStream } from "../../platform/PlatformTools"
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner"
import { QueryLock } from "../../query-runner/QueryLock"
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
import { Query } from "../Query"
import { ColumnType } from "../types/ColumnTypes"
import { IsolationLevel } from "../types/IsolationLevel"
import { MetadataTableType } from "../types/MetadataTableType"
import { ReplicationMode } from "../types/ReplicationMode"
import { MssqlParameter } from "./MssqlParameter"
import { SqlServerDriver } from "./SqlServerDriver"

/**
 * Runs queries on a single SQL Server database connection.
 */
export class SqlServerQueryRunner
    extends BaseQueryRunner
    implements QueryRunner
{
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: SqlServerDriver

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private lock: QueryLock = new QueryLock()

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqlServerDriver, mode: ReplicationMode) {
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
    connect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true
        return Promise.resolve()
    }

    /**
     * Starts transaction.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }
        await new Promise<void>(async (ok, fail) => {
            const transactionCallback = (err: any) => {
                if (err) {
                    this.isTransactionActive = false
                    return fail(err)
                }
                ok()
            }

            if (this.transactionDepth === 0) {
                const pool = await (this.mode === "slave"
                    ? this.driver.obtainSlaveConnection()
                    : this.driver.obtainMasterConnection())
                this.databaseConnection = pool.transaction()
                this.connection.logger.logQuery("BEGIN TRANSACTION")
                if (isolationLevel) {
                    this.databaseConnection.begin(
                        this.convertIsolationLevel(isolationLevel),
                        transactionCallback,
                    )
                    this.connection.logger.logQuery(
                        "SET TRANSACTION ISOLATION LEVEL " + isolationLevel,
                    )
                } else {
                    this.databaseConnection.begin(transactionCallback)
                }
            } else {
                await this.query(
                    `SAVE TRANSACTION typeorm_${this.transactionDepth}`,
                )
                ok()
            }
            this.transactionDepth += 1
        })

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        if (this.transactionDepth === 1) {
            return new Promise<void>((ok, fail) => {
                this.databaseConnection.commit(async (err: any) => {
                    if (err) return fail(err)
                    this.isTransactionActive = false
                    this.databaseConnection = null

                    await this.broadcaster.broadcast("AfterTransactionCommit")

                    ok()
                    this.connection.logger.logQuery("COMMIT")
                    this.transactionDepth -= 1
                })
            })
        }
        this.transactionDepth -= 1
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        if (this.transactionDepth > 1) {
            await this.query(
                `ROLLBACK TRANSACTION typeorm_${this.transactionDepth - 1}`,
            )
            this.transactionDepth -= 1
        } else {
            return new Promise<void>((ok, fail) => {
                this.databaseConnection.rollback(async (err: any) => {
                    if (err) return fail(err)
                    this.isTransactionActive = false
                    this.databaseConnection = null

                    await this.broadcaster.broadcast("AfterTransactionRollback")

                    ok()
                    this.connection.logger.logQuery("ROLLBACK")
                    this.transactionDepth -= 1
                })
            })
        }
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

        const release = await this.lock.acquire()

        this.driver.connection.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()

        try {
            const pool = await (this.mode === "slave"
                ? this.driver.obtainSlaveConnection()
                : this.driver.obtainMasterConnection())
            const request = new this.driver.mssql.Request(
                this.isTransactionActive ? this.databaseConnection : pool,
            )
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    const parameterName = index.toString()
                    if (InstanceChecker.isMssqlParameter(parameter)) {
                        const mssqlParameter =
                            this.mssqlParameterToNativeParameter(parameter)
                        if (mssqlParameter) {
                            request.input(
                                parameterName,
                                mssqlParameter,
                                parameter.value,
                            )
                        } else {
                            request.input(parameterName, parameter.value)
                        }
                    } else {
                        request.input(parameterName, parameter)
                    }
                })
            }
            const queryStartTime = Date.now()

            const raw = await new Promise<any>((ok, fail) => {
                request.query(query, (err: any, raw: any) => {
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
                    ) {
                        this.driver.connection.logger.logQuerySlow(
                            queryExecutionTime,
                            query,
                            parameters,
                            this,
                        )
                    }

                    if (err) {
                        fail(new QueryFailedError(query, parameters, err))
                    }

                    ok(raw)
                })
            })

            const result = new QueryResult()

            if (raw?.hasOwnProperty("recordset")) {
                result.records = raw.recordset
            }

            if (raw?.hasOwnProperty("rowsAffected")) {
                result.affected = raw.rowsAffected[0]
            }

            const queryType = query.slice(0, query.indexOf(" "))
            switch (queryType) {
                case "DELETE":
                    // for DELETE query additionally return number of affected rows
                    result.raw = [raw.recordset, raw.rowsAffected[0]]
                    break
                default:
                    result.raw = raw.recordset
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

            throw err
        } finally {
            await broadcasterResult.wait()

            release()
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

        const release = await this.lock.acquire()

        this.driver.connection.logger.logQuery(query, parameters, this)
        const pool = await (this.mode === "slave"
            ? this.driver.obtainSlaveConnection()
            : this.driver.obtainMasterConnection())
        const request = new this.driver.mssql.Request(
            this.isTransactionActive ? this.databaseConnection : pool,
        )
        if (parameters && parameters.length) {
            parameters.forEach((parameter, index) => {
                const parameterName = index.toString()
                if (InstanceChecker.isMssqlParameter(parameter)) {
                    request.input(
                        parameterName,
                        this.mssqlParameterToNativeParameter(parameter),
                        parameter.value,
                    )
                } else {
                    request.input(parameterName, parameter)
                }
            })
        }

        request.query(query)

        const streamRequest = request.toReadableStream()

        streamRequest.on("error", (err: any) => {
            release()
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
        })

        streamRequest.on("end", () => {
            release()
        })

        if (onEnd) {
            streamRequest.on("end", onEnd)
        }

        if (onError) {
            streamRequest.on("error", onError)
        }

        return streamRequest
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        const results: ObjectLiteral[] = await this.query(`EXEC sp_databases`)
        return results.map((result) => result["DATABASE_NAME"])
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        const query = database
            ? `SELECT * FROM "${database}"."sys"."schema"`
            : `SELECT * FROM "sys"."schemas"`
        const results: ObjectLiteral[] = await this.query(query)
        return results.map((result) => result["name"])
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(
            `SELECT DB_ID('${database}') as "db_id"`,
        )
        const dbId = result[0]["db_id"]
        return !!dbId
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        const currentDBQuery = await this.query(`SELECT DB_NAME() AS "db_name"`)
        return currentDBQuery[0]["db_name"]
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(
            `SELECT SCHEMA_ID('${schema}') as "schema_id"`,
        )
        const schemaId = result[0]["schema_id"]
        return !!schemaId
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<string> {
        const currentSchemaQuery = await this.query(
            `SELECT SCHEMA_NAME() AS "schema_name"`,
        )
        return currentSchemaQuery[0]["schema_name"]
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)

        if (!parsedTableName.database) {
            parsedTableName.database = await this.getCurrentDatabase()
        }

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema()
        }

        const sql = `SELECT * FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_NAME" = '${parsedTableName.tableName}' AND "TABLE_SCHEMA" = '${parsedTableName.schema}'`
        const result = await this.query(sql)
        return result.length ? true : false
    }

    /**
     * Checks if column exist in the table.
     */
    async hasColumn(
        tableOrName: Table | string,
        columnName: string,
    ): Promise<boolean> {
        const parsedTableName = this.driver.parseTableName(tableOrName)

        if (!parsedTableName.database) {
            parsedTableName.database = await this.getCurrentDatabase()
        }

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema()
        }

        const sql = `SELECT * FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."COLUMNS" WHERE "TABLE_NAME" = '${parsedTableName.tableName}' AND "TABLE_SCHEMA" = '${parsedTableName.schema}' AND "COLUMN_NAME" = '${columnName}'`
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
            ? `IF DB_ID('${database}') IS NULL CREATE DATABASE "${database}"`
            : `CREATE DATABASE "${database}"`
        const down = `DROP DATABASE "${database}"`
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist
            ? `IF DB_ID('${database}') IS NOT NULL DROP DATABASE "${database}"`
            : `DROP DATABASE "${database}"`
        const down = `CREATE DATABASE "${database}"`
        await this.executeQueries(new Query(up), new Query(down))
    }

    /**
     * Creates table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be created in specified database.
     */
    async createSchema(
        schemaPath: string,
        ifNotExist?: boolean,
    ): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        if (schemaPath.indexOf(".") === -1) {
            const upQuery = ifNotExist
                ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schemaPath}"') END`
                : `CREATE SCHEMA "${schemaPath}"`
            upQueries.push(new Query(upQuery))
            downQueries.push(new Query(`DROP SCHEMA "${schemaPath}"`))
        } else {
            const dbName = schemaPath.split(".")[0]
            const schema = schemaPath.split(".")[1]
            const currentDB = await this.getCurrentDatabase()
            upQueries.push(new Query(`USE "${dbName}"`))
            downQueries.push(new Query(`USE "${currentDB}"`))

            const upQuery = ifNotExist
                ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schema}"') END`
                : `CREATE SCHEMA "${schema}"`
            upQueries.push(new Query(upQuery))
            downQueries.push(new Query(`DROP SCHEMA "${schema}"`))

            upQueries.push(new Query(`USE "${currentDB}"`))
            downQueries.push(new Query(`USE "${dbName}"`))
        }

        await this.executeQueries(upQueries, downQueries)
    }

    /**
     * Drops table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be dropped in specified database.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        const upQueries: Query[] = []
        const downQueries: Query[] = []

        if (schemaPath.indexOf(".") === -1) {
            const upQuery = ifExist
                ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schemaPath}"') END`
                : `DROP SCHEMA "${schemaPath}"`
            upQueries.push(new Query(upQuery))
            downQueries.push(new Query(`CREATE SCHEMA "${schemaPath}"`))
        } else {
            const dbName = schemaPath.split(".")[0]
            const schema = schemaPath.split(".")[1]
            const currentDB = await this.getCurrentDatabase()
            upQueries.push(new Query(`USE "${dbName}"`))
            downQueries.push(new Query(`USE "${currentDB}"`))

            const upQuery = ifExist
                ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schema}"') END`
                : `DROP SCHEMA "${schema}"`
            upQueries.push(new Query(upQuery))
            downQueries.push(new Query(`CREATE SCHEMA "${schema}"`))

            upQueries.push(new Query(`USE "${currentDB}"`))
            downQueries.push(new Query(`USE "${dbName}"`))
        }

        await this.executeQueries(upQueries, downQueries)
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

        // if table have column with generated type, we must add the expression to the metadata table
        const generatedColumns = table.columns.filter(
            (column) => column.generatedType && column.asExpression,
        )

        for (const column of generatedColumns) {
            const parsedTableName = this.driver.parseTableName(table)

            if (!parsedTableName.schema) {
                parsedTableName.schema = await this.getCurrentSchema()
            }

            const insertQuery = this.insertTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
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

        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.

        if (dropIndices) {
            table.indices.forEach((index) => {
                upQueries.push(this.dropIndexSql(table, index))
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
            const parsedTableName = this.driver.parseTableName(table)

            if (!parsedTableName.schema) {
                parsedTableName.schema = await this.getCurrentSchema()
            }

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })

            const insertQuery = this.insertTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
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

        // we need database name and schema name to rename FK constraints
        let dbName: string | undefined = undefined
        let schemaName: string | undefined = undefined
        let oldTableName: string = oldTable.name
        const splittedName = oldTable.name.split(".")
        if (splittedName.length === 3) {
            dbName = splittedName[0]
            oldTableName = splittedName[2]
            if (splittedName[1] !== "") schemaName = splittedName[1]
        } else if (splittedName.length === 2) {
            schemaName = splittedName[0]
            oldTableName = splittedName[1]
        }

        newTable.name = this.driver.buildTableName(
            newTableName,
            schemaName,
            dbName,
        )

        // if we have tables with database which differs from database specified in config, we must change currently used database.
        // This need because we can not rename objects from another database.
        const currentDB = await this.getCurrentDatabase()
        if (dbName && dbName !== currentDB) {
            upQueries.push(new Query(`USE "${dbName}"`))
            downQueries.push(new Query(`USE "${currentDB}"`))
        }

        // rename table
        upQueries.push(
            new Query(
                `EXEC sp_rename "${this.getTablePath(
                    oldTable,
                )}", "${newTableName}"`,
            ),
        )
        downQueries.push(
            new Query(
                `EXEC sp_rename "${this.getTablePath(
                    newTable,
                )}", "${oldTableName}"`,
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

            // rename primary constraint
            upQueries.push(
                new Query(
                    `EXEC sp_rename "${this.getTablePath(
                        newTable,
                    )}.${oldPkName}", "${newPkName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `EXEC sp_rename "${this.getTablePath(
                        newTable,
                    )}.${newPkName}", "${oldPkName}"`,
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
                    `EXEC sp_rename "${this.getTablePath(newTable)}.${
                        unique.name
                    }", "${newUniqueName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `EXEC sp_rename "${this.getTablePath(
                        newTable,
                    )}.${newUniqueName}", "${unique.name}"`,
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
                    `EXEC sp_rename "${this.getTablePath(newTable)}.${
                        index.name
                    }", "${newIndexName}", "INDEX"`,
                ),
            )
            downQueries.push(
                new Query(
                    `EXEC sp_rename "${this.getTablePath(
                        newTable,
                    )}.${newIndexName}", "${index.name}", "INDEX"`,
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
                    `EXEC sp_rename "${this.buildForeignKeyName(
                        foreignKey.name!,
                        schemaName,
                        dbName,
                    )}", "${newForeignKeyName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `EXEC sp_rename "${this.buildForeignKeyName(
                        newForeignKeyName,
                        schemaName,
                        dbName,
                    )}", "${foreignKey.name}"`,
                ),
            )

            // replace constraint name
            foreignKey.name = newForeignKeyName
        })

        // change currently used database back to default db.
        if (dbName && dbName !== currentDB) {
            upQueries.push(new Query(`USE "${currentDB}"`))
            downQueries.push(new Query(`USE "${dbName}"`))
        }

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
                )} ADD ${this.buildCreateColumnSql(
                    table,
                    column,
                    false,
                    true,
                )}`,
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
            upQueries.push(this.createIndexSql(table, columnIndex))
            downQueries.push(this.dropIndexSql(table, columnIndex))
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

        // remove default constraint
        if (column.default !== null && column.default !== undefined) {
            const defaultName =
                this.connection.namingStrategy.defaultConstraintName(
                    table,
                    column.name,
                )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} DROP CONSTRAINT "${defaultName}"`,
                ),
            )
        }

        if (column.generatedType && column.asExpression) {
            const parsedTableName = this.driver.parseTableName(table)

            if (!parsedTableName.schema) {
                parsedTableName.schema = await this.getCurrentSchema()
            }

            const insertQuery = this.insertTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
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
                `Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`,
            )

        if (
            (newColumn.isGenerated !== oldColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid") ||
            newColumn.type !== oldColumn.type ||
            newColumn.length !== oldColumn.length ||
            newColumn.asExpression !== oldColumn.asExpression ||
            newColumn.generatedType !== oldColumn.generatedType
        ) {
            // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
            // Also, we recreate column if column type changed
            await this.dropColumn(table, oldColumn)
            await this.addColumn(table, newColumn)

            // update cloned table
            clonedTable = table.clone()
        } else {
            if (newColumn.name !== oldColumn.name) {
                // we need database name and schema name to rename FK constraints
                let dbName: string | undefined = undefined
                let schemaName: string | undefined = undefined
                const splittedName = table.name.split(".")
                if (splittedName.length === 3) {
                    dbName = splittedName[0]
                    if (splittedName[1] !== "") schemaName = splittedName[1]
                } else if (splittedName.length === 2) {
                    schemaName = splittedName[0]
                }

                // if we have tables with database which differs from database specified in config, we must change currently used database.
                // This need because we can not rename objects from another database.
                const currentDB = await this.getCurrentDatabase()
                if (dbName && dbName !== currentDB) {
                    upQueries.push(new Query(`USE "${dbName}"`))
                    downQueries.push(new Query(`USE "${currentDB}"`))
                }

                // rename the column
                upQueries.push(
                    new Query(
                        `EXEC sp_rename "${this.getTablePath(table)}.${
                            oldColumn.name
                        }", "${newColumn.name}"`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `EXEC sp_rename "${this.getTablePath(table)}.${
                            newColumn.name
                        }", "${oldColumn.name}"`,
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

                    // rename primary constraint
                    upQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${oldPkName}", "${newPkName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${newPkName}", "${oldPkName}"`,
                        ),
                    )
                }

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
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${index.name}", "${newIndexName}", "INDEX"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${newIndexName}", "${index.name}", "INDEX"`,
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
                                `EXEC sp_rename "${this.buildForeignKeyName(
                                    foreignKey.name!,
                                    schemaName,
                                    dbName,
                                )}", "${newForeignKeyName}"`,
                            ),
                        )
                        downQueries.push(
                            new Query(
                                `EXEC sp_rename "${this.buildForeignKeyName(
                                    newForeignKeyName,
                                    schemaName,
                                    dbName,
                                )}", "${foreignKey.name}"`,
                            ),
                        )

                        // replace constraint name
                        foreignKey.name = newForeignKeyName
                    })

                // rename check constraints
                clonedTable.findColumnChecks(oldColumn).forEach((check) => {
                    // build new constraint name
                    check.columnNames!.splice(
                        check.columnNames!.indexOf(oldColumn.name),
                        1,
                    )
                    check.columnNames!.push(newColumn.name)
                    const newCheckName =
                        this.connection.namingStrategy.checkConstraintName(
                            clonedTable,
                            check.expression!,
                        )

                    // build queries
                    upQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${check.name}", "${newCheckName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${newCheckName}", "${check.name}"`,
                        ),
                    )

                    // replace constraint name
                    check.name = newCheckName
                })

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
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${unique.name}", "${newUniqueName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `EXEC sp_rename "${this.getTablePath(
                                clonedTable,
                            )}.${newUniqueName}", "${unique.name}"`,
                        ),
                    )

                    // replace constraint name
                    unique.name = newUniqueName
                })

                // rename default constraints
                if (
                    oldColumn.default !== null &&
                    oldColumn.default !== undefined
                ) {
                    const oldDefaultName =
                        this.connection.namingStrategy.defaultConstraintName(
                            table,
                            oldColumn.name,
                        )
                    const newDefaultName =
                        this.connection.namingStrategy.defaultConstraintName(
                            table,
                            newColumn.name,
                        )

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${oldDefaultName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${oldDefaultName}" DEFAULT ${
                                oldColumn.default
                            } FOR "${newColumn.name}"`,
                        ),
                    )

                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${newDefaultName}" DEFAULT ${
                                oldColumn.default
                            } FOR "${newColumn.name}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${newDefaultName}"`,
                        ),
                    )
                }

                // change currently used database back to default db.
                if (dbName && dbName !== currentDB) {
                    upQueries.push(new Query(`USE "${currentDB}"`))
                    downQueries.push(new Query(`USE "${dbName}"`))
                }

                // rename old column in the Table object
                const oldTableColumn = clonedTable.columns.find(
                    (column) => column.name === oldColumn.name,
                )
                clonedTable.columns[
                    clonedTable.columns.indexOf(oldTableColumn!)
                ].name = newColumn.name
                oldColumn.name = newColumn.name
            }

            if (
                this.isColumnChanged(oldColumn, newColumn, false, false, false)
            ) {
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} ALTER COLUMN ${this.buildCreateColumnSql(
                            table,
                            newColumn,
                            true,
                            false,
                            true,
                        )}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(
                            table,
                        )} ALTER COLUMN ${this.buildCreateColumnSql(
                            table,
                            oldColumn,
                            true,
                            false,
                            true,
                        )}`,
                    ),
                )
            }

            if (this.isEnumChanged(oldColumn, newColumn)) {
                const oldExpression = this.getEnumExpression(oldColumn)
                const oldCheck = new TableCheck({
                    name: this.connection.namingStrategy.checkConstraintName(
                        table,
                        oldExpression,
                        true,
                    ),
                    expression: oldExpression,
                })

                const newExpression = this.getEnumExpression(newColumn)
                const newCheck = new TableCheck({
                    name: this.connection.namingStrategy.checkConstraintName(
                        table,
                        newExpression,
                        true,
                    ),
                    expression: newExpression,
                })

                upQueries.push(this.dropCheckConstraintSql(table, oldCheck))
                upQueries.push(this.createCheckConstraintSql(table, newCheck))

                downQueries.push(this.dropCheckConstraintSql(table, newCheck))
                downQueries.push(this.createCheckConstraintSql(table, oldCheck))
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

            if (newColumn.default !== oldColumn.default) {
                // (note) if there is a previous default, we need to drop its constraint first
                if (
                    oldColumn.default !== null &&
                    oldColumn.default !== undefined
                ) {
                    const defaultName =
                        this.connection.namingStrategy.defaultConstraintName(
                            table,
                            oldColumn.name,
                        )
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${defaultName}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${defaultName}" DEFAULT ${
                                oldColumn.default
                            } FOR "${oldColumn.name}"`,
                        ),
                    )
                }

                if (
                    newColumn.default !== null &&
                    newColumn.default !== undefined
                ) {
                    const defaultName =
                        this.connection.namingStrategy.defaultConstraintName(
                            table,
                            newColumn.name,
                        )
                    upQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} ADD CONSTRAINT "${defaultName}" DEFAULT ${
                                newColumn.default
                            } FOR "${newColumn.name}"`,
                        ),
                    )
                    downQueries.push(
                        new Query(
                            `ALTER TABLE ${this.escapePath(
                                table,
                            )} DROP CONSTRAINT "${defaultName}"`,
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
                `Column "${columnOrName}" was not found in table "${table.name}"`,
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

        // drop default constraint
        if (column.default !== null && column.default !== undefined) {
            const defaultName =
                this.connection.namingStrategy.defaultConstraintName(
                    table,
                    column.name,
                )
            upQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} DROP CONSTRAINT "${defaultName}"`,
                ),
            )
            downQueries.push(
                new Query(
                    `ALTER TABLE ${this.escapePath(
                        table,
                    )} ADD CONSTRAINT "${defaultName}" DEFAULT ${
                        column.default
                    } FOR "${column.name}"`,
                ),
            )
        }

        if (column.generatedType && column.asExpression) {
            const parsedTableName = this.driver.parseTableName(table)

            if (!parsedTableName.schema) {
                parsedTableName.schema = await this.getCurrentSchema()
            }

            const deleteQuery = this.deleteTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
            })
            const insertQuery = this.insertTypeormMetadataSql({
                database: parsedTableName.database,
                schema: parsedTableName.schema,
                table: parsedTableName.tableName,
                type: MetadataTableType.GENERATED_COLUMN,
                name: column.name,
                value: column.asExpression,
            })

            upQueries.push(deleteQuery)
            downQueries.push(insertQuery)
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
                )} ADD ${this.buildCreateColumnSql(
                    table,
                    column,
                    false,
                    false,
                )}`,
            ),
        )

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
        const clonedTable = table.clone()
        const columnNames = columns.map((column) => column.name)
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
     * Drops unique constraint.
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
     * Drops a unique constraints.
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
     * Creates a new check constraint.
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
     * Creates a new check constraints.
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
        throw new TypeORMError(
            `SqlServer does not support exclusion constraints.`,
        )
    }

    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(
            `SqlServer does not support exclusion constraints.`,
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
            `SqlServer does not support exclusion constraints.`,
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
            `SqlServer does not support exclusion constraints.`,
        )
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
        const metadata = this.connection.hasMetadata(table.name)
            ? this.connection.getMetadata(table.name)
            : undefined

        if (
            metadata &&
            metadata.treeParentRelation &&
            metadata.treeParentRelation!.isTreeParent &&
            metadata.foreignKeys.find(
                (foreignKey) => foreignKey.onDelete !== "NO ACTION",
            )
        )
            throw new TypeORMError(
                "SqlServer does not support options in TreeParent.",
            )

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
                `Supplied index was not found in table ${table.name}`,
            )

        // old index may be passed without name. In this case we generate index name manually.
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
        const promises = indices.map((index) =>
            this.dropIndex(tableOrName, index),
        )
        await Promise.all(promises)
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tablePath: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapePath(tablePath)}`)
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(database?: string): Promise<void> {
        if (database) {
            const isDatabaseExist = await this.hasDatabase(database)
            if (!isDatabaseExist) return Promise.resolve()
        }

        const isAnotherTransactionActive = this.isTransactionActive
        if (!isAnotherTransactionActive) await this.startTransaction()
        try {
            const allViewsSql = database
                ? `SELECT * FROM "${database}"."INFORMATION_SCHEMA"."VIEWS"`
                : `SELECT * FROM "INFORMATION_SCHEMA"."VIEWS"`
            const allViewsResults: ObjectLiteral[] = await this.query(
                allViewsSql,
            )

            await Promise.all(
                allViewsResults.map((viewResult) => {
                    // 'DROP VIEW' does not allow specifying the database name as a prefix to the object name.
                    const dropTableSql = `DROP VIEW "${viewResult["TABLE_SCHEMA"]}"."${viewResult["TABLE_NAME"]}"`
                    return this.query(dropTableSql)
                }),
            )

            const allTablesSql = database
                ? `SELECT * FROM "${database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_TYPE" = 'BASE TABLE'`
                : `SELECT * FROM "INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_TYPE" = 'BASE TABLE'`
            const allTablesResults: ObjectLiteral[] = await this.query(
                allTablesSql,
            )

            if (allTablesResults.length > 0) {
                const tablesByCatalog: {
                    [key: string]: {
                        TABLE_NAME: string
                        TABLE_SCHEMA: string
                    }[]
                } = allTablesResults.reduce(
                    (c, { TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME }) => {
                        c[TABLE_CATALOG] = c[TABLE_CATALOG] || []
                        c[TABLE_CATALOG].push({ TABLE_SCHEMA, TABLE_NAME })
                        return c
                    },
                    {},
                )

                const foreignKeysSql = Object.entries(tablesByCatalog)
                    .map(([TABLE_CATALOG, tables]) => {
                        const conditions = tables
                            .map(({ TABLE_SCHEMA, TABLE_NAME }) => {
                                return `("fk"."referenced_object_id" = OBJECT_ID('"${TABLE_CATALOG}"."${TABLE_SCHEMA}"."${TABLE_NAME}"'))`
                            })
                            .join(" OR ")

                        return `
                        SELECT DISTINCT '${TABLE_CATALOG}' AS                                              "TABLE_CATALOG",
                                        OBJECT_SCHEMA_NAME("fk"."parent_object_id",
                                                           DB_ID('${TABLE_CATALOG}')) AS                   "TABLE_SCHEMA",
                                        OBJECT_NAME("fk"."parent_object_id", DB_ID('${TABLE_CATALOG}')) AS "TABLE_NAME",
                                        "fk"."name" AS                                                     "CONSTRAINT_NAME"
                        FROM "${TABLE_CATALOG}"."sys"."foreign_keys" AS "fk"
                        WHERE (${conditions})
                    `
                    })
                    .join(" UNION ALL ")

                const foreignKeys: {
                    TABLE_CATALOG: string
                    TABLE_SCHEMA: string
                    TABLE_NAME: string
                    CONSTRAINT_NAME: string
                }[] = await this.query(foreignKeysSql)

                await Promise.all(
                    foreignKeys.map(
                        async ({
                            TABLE_CATALOG,
                            TABLE_SCHEMA,
                            TABLE_NAME,
                            CONSTRAINT_NAME,
                        }) => {
                            // Disable the constraint first.
                            await this.query(
                                `ALTER TABLE "${TABLE_CATALOG}"."${TABLE_SCHEMA}"."${TABLE_NAME}" ` +
                                    `NOCHECK CONSTRAINT "${CONSTRAINT_NAME}"`,
                            )

                            await this.query(
                                `ALTER TABLE "${TABLE_CATALOG}"."${TABLE_SCHEMA}"."${TABLE_NAME}" ` +
                                    `DROP CONSTRAINT "${CONSTRAINT_NAME}" -- FROM CLEAR`,
                            )
                        },
                    ),
                )

                await Promise.all(
                    allTablesResults.map(async (tablesResult) => {
                        if (tablesResult["TABLE_NAME"].startsWith("#")) {
                            // don't try to drop temporary tables
                            return
                        }

                        const dropTableSql = `DROP TABLE "${tablesResult["TABLE_CATALOG"]}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`
                        return this.query(dropTableSql)
                    }),
                )
            }

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

    protected async loadViews(viewPaths?: string[]): Promise<View[]> {
        const hasTable = await this.hasTable(this.getTypeormMetadataTableName())
        if (!hasTable) {
            return []
        }

        if (!viewPaths) {
            viewPaths = []
        }

        const currentSchema = await this.getCurrentSchema()
        const currentDatabase = await this.getCurrentDatabase()

        const dbNames = viewPaths
            .map((viewPath) => this.driver.parseTableName(viewPath).database)
            .filter((database) => database)

        if (
            this.driver.database &&
            !dbNames.find((dbName) => dbName === this.driver.database)
        )
            dbNames.push(this.driver.database)

        const viewsCondition = viewPaths
            .map((viewPath) => {
                let { schema, tableName: name } =
                    this.driver.parseTableName(viewPath)

                if (!schema) {
                    schema = currentSchema
                }
                return `("T"."SCHEMA" = '${schema}' AND "T"."NAME" = '${name}')`
            })
            .join(" OR ")

        const query = dbNames
            .map((dbName) => {
                return (
                    `SELECT "T".*, "V"."CHECK_OPTION" FROM ${this.escapePath(
                        this.getTypeormMetadataTableName(),
                    )} "t" ` +
                    `INNER JOIN "${dbName}"."INFORMATION_SCHEMA"."VIEWS" "V" ON "V"."TABLE_SCHEMA" = "T"."SCHEMA" AND "v"."TABLE_NAME" = "T"."NAME" WHERE "T"."TYPE" = '${
                        MetadataTableType.VIEW
                    }' ${viewsCondition ? `AND (${viewsCondition})` : ""}`
                )
            })
            .join(" UNION ALL ")

        const dbViews = await this.query(query)
        return dbViews.map((dbView: any) => {
            const view = new View()
            const db =
                dbView["TABLE_CATALOG"] === currentDatabase
                    ? undefined
                    : dbView["TABLE_CATALOG"]
            const schema =
                dbView["schema"] === currentSchema &&
                !this.driver.options.schema
                    ? undefined
                    : dbView["schema"]
            view.database = dbView["TABLE_CATALOG"]
            view.schema = dbView["schema"]
            view.name = this.driver.buildTableName(dbView["name"], schema, db)
            view.expression = dbView["value"]
            return view
        })
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        // if no tables given then no need to proceed
        if (tableNames && tableNames.length === 0) {
            return []
        }

        const currentSchema = await this.getCurrentSchema()
        const currentDatabase = await this.getCurrentDatabase()

        const dbTables: {
            TABLE_CATALOG: string
            TABLE_SCHEMA: string
            TABLE_NAME: string
        }[] = []

        if (!tableNames) {
            const databasesSql =
                `SELECT DISTINCT "name" ` +
                `FROM "master"."dbo"."sysdatabases" ` +
                `WHERE "name" NOT IN ('master', 'model', 'msdb')`
            const dbDatabases: { name: string }[] = await this.query(
                databasesSql,
            )

            const tablesSql = dbDatabases
                .map(({ name }) => {
                    return `
                    SELECT DISTINCT
                        "TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME"
                    FROM "${name}"."INFORMATION_SCHEMA"."TABLES"
                    WHERE
                      "TABLE_TYPE" = 'BASE TABLE'
                      AND
                      "TABLE_CATALOG" = '${name}'
                      AND
                      ISNULL(Objectproperty(Object_id("TABLE_CATALOG" + '.' + "TABLE_SCHEMA" + '.' + "TABLE_NAME"), 'IsMSShipped'), 0) = 0
                `
                })
                .join(" UNION ALL ")

            dbTables.push(...(await this.query(tablesSql)))
        } else {
            const tableNamesByCatalog = tableNames
                .map((tableName) => this.driver.parseTableName(tableName))
                .reduce((c, { database, ...other }) => {
                    database = database || currentDatabase
                    c[database] = c[database] || []
                    c[database].push({
                        schema: other.schema || currentSchema,
                        tableName: other.tableName,
                    })
                    return c
                }, {} as { [key: string]: { schema: string; tableName: string }[] })

            const tablesSql = Object.entries(tableNamesByCatalog)
                .map(([database, tables]) => {
                    const tablesCondition = tables
                        .map(({ schema, tableName }) => {
                            return `("TABLE_SCHEMA" = '${schema}' AND "TABLE_NAME" = '${tableName}')`
                        })
                        .join(" OR ")

                    return `
                    SELECT DISTINCT
                        "TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME"
                    FROM "${database}"."INFORMATION_SCHEMA"."TABLES"
                    WHERE
                          "TABLE_TYPE" = 'BASE TABLE' AND
                          "TABLE_CATALOG" = '${database}' AND
                          ${tablesCondition}
                `
                })
                .join(" UNION ALL ")

            dbTables.push(...(await this.query(tablesSql)))
        }

        // if tables were not found in the db, no need to proceed
        if (dbTables.length === 0) {
            return []
        }

        const dbTablesByCatalog = dbTables.reduce(
            (c, { TABLE_CATALOG, ...other }) => {
                c[TABLE_CATALOG] = c[TABLE_CATALOG] || []
                c[TABLE_CATALOG].push(other)
                return c
            },
            {} as {
                [key: string]: { TABLE_NAME: string; TABLE_SCHEMA: string }[]
            },
        )

        const columnsSql = Object.entries(dbTablesByCatalog)
            .map(([TABLE_CATALOG, tables]) => {
                const condition = tables
                    .map(
                        ({ TABLE_SCHEMA, TABLE_NAME }) =>
                            `("TABLE_SCHEMA" = '${TABLE_SCHEMA}' AND "TABLE_NAME" = '${TABLE_NAME}')`,
                    )
                    .join("OR")

                return (
                    `SELECT "COLUMNS".*, "cc"."is_persisted", "cc"."definition" ` +
                    `FROM "${TABLE_CATALOG}"."INFORMATION_SCHEMA"."COLUMNS" ` +
                    `LEFT JOIN "sys"."computed_columns" "cc" ON COL_NAME("cc"."object_id", "cc"."column_id") = "column_name" ` +
                    `WHERE (${condition})`
                )
            })
            .join(" UNION ALL ")

        const constraintsSql = Object.entries(dbTablesByCatalog)
            .map(([TABLE_CATALOG, tables]) => {
                const conditions = tables
                    .map(
                        ({ TABLE_NAME, TABLE_SCHEMA }) =>
                            `("columnUsages"."TABLE_SCHEMA" = '${TABLE_SCHEMA}' AND "columnUsages"."TABLE_NAME" = '${TABLE_NAME}')`,
                    )
                    .join(" OR ")

                return (
                    `SELECT "columnUsages".*, "tableConstraints"."CONSTRAINT_TYPE", "chk"."definition" ` +
                    `FROM "${TABLE_CATALOG}"."INFORMATION_SCHEMA"."CONSTRAINT_COLUMN_USAGE" "columnUsages" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."INFORMATION_SCHEMA"."TABLE_CONSTRAINTS" "tableConstraints" ` +
                    `ON ` +
                    `"tableConstraints"."CONSTRAINT_NAME" = "columnUsages"."CONSTRAINT_NAME" AND ` +
                    `"tableConstraints"."TABLE_SCHEMA" = "columnUsages"."TABLE_SCHEMA" AND ` +
                    `"tableConstraints"."TABLE_NAME" = "columnUsages"."TABLE_NAME" ` +
                    `LEFT JOIN "${TABLE_CATALOG}"."sys"."check_constraints" "chk" ` +
                    `ON ` +
                    `"chk"."object_id" = OBJECT_ID("columnUsages"."TABLE_CATALOG" + '.' + "columnUsages"."TABLE_SCHEMA" + '.' + "columnUsages"."CONSTRAINT_NAME") ` +
                    `WHERE ` +
                    `(${conditions}) AND ` +
                    `"tableConstraints"."CONSTRAINT_TYPE" IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')`
                )
            })
            .join(" UNION ALL ")

        const foreignKeysSql = Object.entries(dbTablesByCatalog)
            .map(([TABLE_CATALOG, tables]) => {
                const conditions = tables
                    .map(
                        ({ TABLE_NAME, TABLE_SCHEMA }) =>
                            `("s1"."name" = '${TABLE_SCHEMA}' AND "t1"."name" = '${TABLE_NAME}')`,
                    )
                    .join(" OR ")

                return (
                    `SELECT "fk"."name" AS "FK_NAME", '${TABLE_CATALOG}' AS "TABLE_CATALOG", "s1"."name" AS "TABLE_SCHEMA", "t1"."name" AS "TABLE_NAME", ` +
                    `"col1"."name" AS "COLUMN_NAME", "s2"."name" AS "REF_SCHEMA", "t2"."name" AS "REF_TABLE", "col2"."name" AS "REF_COLUMN", ` +
                    `"fk"."delete_referential_action_desc" AS "ON_DELETE", "fk"."update_referential_action_desc" AS "ON_UPDATE" ` +
                    `FROM "${TABLE_CATALOG}"."sys"."foreign_keys" "fk" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."foreign_key_columns" "fkc" ON "fkc"."constraint_object_id" = "fk"."object_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."tables" "t1" ON "t1"."object_id" = "fk"."parent_object_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."schemas" "s1" ON "s1"."schema_id" = "t1"."schema_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."tables" "t2" ON "t2"."object_id" = "fk"."referenced_object_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."schemas" "s2" ON "s2"."schema_id" = "t2"."schema_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."columns" "col1" ON "col1"."column_id" = "fkc"."parent_column_id" AND "col1"."object_id" = "fk"."parent_object_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."columns" "col2" ON "col2"."column_id" = "fkc"."referenced_column_id" AND "col2"."object_id" = "fk"."referenced_object_id" ` +
                    `WHERE (${conditions})`
                )
            })
            .join(" UNION ALL ")

        const identityColumnsSql = Object.entries(dbTablesByCatalog)
            .map(([TABLE_CATALOG, tables]) => {
                const conditions = tables
                    .map(
                        ({ TABLE_NAME, TABLE_SCHEMA }) =>
                            `("TABLE_SCHEMA" = '${TABLE_SCHEMA}' AND "TABLE_NAME" = '${TABLE_NAME}')`,
                    )
                    .join(" OR ")

                return (
                    `SELECT "TABLE_CATALOG", "TABLE_SCHEMA", "COLUMN_NAME", "TABLE_NAME" ` +
                    `FROM "${TABLE_CATALOG}"."INFORMATION_SCHEMA"."COLUMNS" ` +
                    `WHERE ` +
                    `EXISTS(SELECT 1 FROM "${TABLE_CATALOG}"."sys"."columns" "S" WHERE OBJECT_ID("TABLE_CATALOG" + '.' + "TABLE_SCHEMA" + '.' + "TABLE_NAME") = "S"."OBJECT_ID" AND "COLUMN_NAME" = "S"."NAME" AND "S"."is_identity" = 1) AND ` +
                    `(${conditions})`
                )
            })
            .join(" UNION ALL ")

        const dbCollationsSql = `SELECT "NAME", "COLLATION_NAME" FROM "sys"."databases"`

        const indicesSql = Object.entries(dbTablesByCatalog)
            .map(([TABLE_CATALOG, tables]) => {
                const conditions = tables
                    .map(
                        ({ TABLE_NAME, TABLE_SCHEMA }) =>
                            `("s"."name" = '${TABLE_SCHEMA}' AND "t"."name" = '${TABLE_NAME}')`,
                    )
                    .join(" OR ")

                return (
                    `SELECT '${TABLE_CATALOG}' AS "TABLE_CATALOG", "s"."name" AS "TABLE_SCHEMA", "t"."name" AS "TABLE_NAME", ` +
                    `"ind"."name" AS "INDEX_NAME", "col"."name" AS "COLUMN_NAME", "ind"."is_unique" AS "IS_UNIQUE", "ind"."filter_definition" as "CONDITION" ` +
                    `FROM "${TABLE_CATALOG}"."sys"."indexes" "ind" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."index_columns" "ic" ON "ic"."object_id" = "ind"."object_id" AND "ic"."index_id" = "ind"."index_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."columns" "col" ON "col"."object_id" = "ic"."object_id" AND "col"."column_id" = "ic"."column_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."tables" "t" ON "t"."object_id" = "ind"."object_id" ` +
                    `INNER JOIN "${TABLE_CATALOG}"."sys"."schemas" "s" ON "s"."schema_id" = "t"."schema_id" ` +
                    `WHERE ` +
                    `"ind"."is_primary_key" = 0 AND "ind"."is_unique_constraint" = 0 AND "t"."is_ms_shipped" = 0 AND ` +
                    `(${conditions})`
                )
            })
            .join(" UNION ALL ")

        const [
            dbColumns,
            dbConstraints,
            dbForeignKeys,
            dbIdentityColumns,
            dbCollations,
            dbIndices,
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(foreignKeysSql),
            this.query(identityColumnsSql),
            this.query(dbCollationsSql),
            this.query(indicesSql),
        ])

        // create table schemas for loaded tables
        return await Promise.all(
            dbTables.map(async (dbTable) => {
                const table = new Table()

                const getSchemaFromKey = (dbObject: any, key: string) => {
                    return dbObject[key] === currentSchema &&
                        (!this.driver.options.schema ||
                            this.driver.options.schema === currentSchema)
                        ? undefined
                        : dbObject[key]
                }

                // We do not need to join schema and database names, when db or schema is by default.
                const db =
                    dbTable["TABLE_CATALOG"] === currentDatabase
                        ? undefined
                        : dbTable["TABLE_CATALOG"]
                const schema = getSchemaFromKey(dbTable, "TABLE_SCHEMA")
                table.database = dbTable["TABLE_CATALOG"]
                table.schema = dbTable["TABLE_SCHEMA"]
                table.name = this.driver.buildTableName(
                    dbTable["TABLE_NAME"],
                    schema,
                    db,
                )

                const defaultCollation = dbCollations.find(
                    (dbCollation) =>
                        dbCollation["NAME"] === dbTable["TABLE_CATALOG"],
                )!

                // create columns from the loaded columns
                table.columns = await Promise.all(
                    dbColumns
                        .filter(
                            (dbColumn) =>
                                dbColumn["TABLE_NAME"] ===
                                    dbTable["TABLE_NAME"] &&
                                dbColumn["TABLE_SCHEMA"] ===
                                    dbTable["TABLE_SCHEMA"] &&
                                dbColumn["TABLE_CATALOG"] ===
                                    dbTable["TABLE_CATALOG"],
                        )
                        .map(async (dbColumn) => {
                            const columnConstraints = dbConstraints.filter(
                                (dbConstraint) =>
                                    dbConstraint["TABLE_NAME"] ===
                                        dbColumn["TABLE_NAME"] &&
                                    dbConstraint["TABLE_SCHEMA"] ===
                                        dbColumn["TABLE_SCHEMA"] &&
                                    dbConstraint["TABLE_CATALOG"] ===
                                        dbColumn["TABLE_CATALOG"] &&
                                    dbConstraint["COLUMN_NAME"] ===
                                        dbColumn["COLUMN_NAME"],
                            )

                            const uniqueConstraints = columnConstraints.filter(
                                (constraint) =>
                                    constraint["CONSTRAINT_TYPE"] === "UNIQUE",
                            )
                            const isConstraintComposite =
                                uniqueConstraints.every((uniqueConstraint) => {
                                    return dbConstraints.some(
                                        (dbConstraint) =>
                                            dbConstraint["CONSTRAINT_TYPE"] ===
                                                "UNIQUE" &&
                                            dbConstraint["CONSTRAINT_NAME"] ===
                                                uniqueConstraint[
                                                    "CONSTRAINT_NAME"
                                                ] &&
                                            dbConstraint["TABLE_SCHEMA"] ===
                                                dbColumn["TABLE_SCHEMA"] &&
                                            dbConstraint["TABLE_CATALOG"] ===
                                                dbColumn["TABLE_CATALOG"] &&
                                            dbConstraint["COLUMN_NAME"] !==
                                                dbColumn["COLUMN_NAME"],
                                    )
                                })

                            const isGenerated = !!dbIdentityColumns.find(
                                (column) =>
                                    column["TABLE_NAME"] ===
                                        dbColumn["TABLE_NAME"] &&
                                    column["TABLE_SCHEMA"] ===
                                        dbColumn["TABLE_SCHEMA"] &&
                                    column["TABLE_CATALOG"] ===
                                        dbColumn["TABLE_CATALOG"] &&
                                    column["COLUMN_NAME"] ===
                                        dbColumn["COLUMN_NAME"],
                            )

                            const tableColumn = new TableColumn()
                            tableColumn.name = dbColumn["COLUMN_NAME"]
                            tableColumn.type =
                                dbColumn["DATA_TYPE"].toLowerCase()

                            // check only columns that have length property
                            if (
                                this.driver.withLengthColumnTypes.indexOf(
                                    tableColumn.type as ColumnType,
                                ) !== -1 &&
                                dbColumn["CHARACTER_MAXIMUM_LENGTH"]
                            ) {
                                const length =
                                    dbColumn[
                                        "CHARACTER_MAXIMUM_LENGTH"
                                    ].toString()
                                if (length === "-1") {
                                    tableColumn.length = "MAX"
                                } else {
                                    tableColumn.length =
                                        !this.isDefaultColumnLength(
                                            table,
                                            tableColumn,
                                            length,
                                        )
                                            ? length
                                            : ""
                                }
                            }

                            if (
                                tableColumn.type === "decimal" ||
                                tableColumn.type === "numeric"
                            ) {
                                if (
                                    dbColumn["NUMERIC_PRECISION"] !== null &&
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["NUMERIC_PRECISION"],
                                    )
                                )
                                    tableColumn.precision =
                                        dbColumn["NUMERIC_PRECISION"]
                                if (
                                    dbColumn["NUMERIC_SCALE"] !== null &&
                                    !this.isDefaultColumnScale(
                                        table,
                                        tableColumn,
                                        dbColumn["NUMERIC_SCALE"],
                                    )
                                )
                                    tableColumn.scale =
                                        dbColumn["NUMERIC_SCALE"]
                            }

                            if (tableColumn.type === "nvarchar") {
                                // Check if this is an enum
                                const columnCheckConstraints =
                                    columnConstraints.filter(
                                        (constraint) =>
                                            constraint["CONSTRAINT_TYPE"] ===
                                            "CHECK",
                                    )
                                if (columnCheckConstraints.length) {
                                    // const isEnumRegexp = new RegExp("^\\(\\[" + tableColumn.name + "\\]='[^']+'(?: OR \\[" + tableColumn.name + "\\]='[^']+')*\\)$");
                                    for (const checkConstraint of columnCheckConstraints) {
                                        if (
                                            this.isEnumCheckConstraint(
                                                checkConstraint[
                                                    "CONSTRAINT_NAME"
                                                ],
                                            )
                                        ) {
                                            // This is an enum constraint, make column into an enum
                                            tableColumn.enum = []
                                            const enumValueRegexp = new RegExp(
                                                "\\[" +
                                                    tableColumn.name +
                                                    "\\]='([^']+)'",
                                                "g",
                                            )
                                            let result
                                            while (
                                                (result = enumValueRegexp.exec(
                                                    checkConstraint[
                                                        "definition"
                                                    ],
                                                )) !== null
                                            ) {
                                                tableColumn.enum.unshift(
                                                    result[1],
                                                )
                                            }
                                            // Skip other column constraints
                                            break
                                        }
                                    }
                                }
                            }

                            const primaryConstraint = columnConstraints.find(
                                (constraint) =>
                                    constraint["CONSTRAINT_TYPE"] ===
                                    "PRIMARY KEY",
                            )
                            if (primaryConstraint) {
                                tableColumn.isPrimary = true
                                // find another columns involved in primary key constraint
                                const anotherPrimaryConstraints =
                                    dbConstraints.filter(
                                        (constraint) =>
                                            constraint["TABLE_NAME"] ===
                                                dbColumn["TABLE_NAME"] &&
                                            constraint["TABLE_SCHEMA"] ===
                                                dbColumn["TABLE_SCHEMA"] &&
                                            constraint["TABLE_CATALOG"] ===
                                                dbColumn["TABLE_CATALOG"] &&
                                            constraint["COLUMN_NAME"] !==
                                                dbColumn["COLUMN_NAME"] &&
                                            constraint["CONSTRAINT_TYPE"] ===
                                                "PRIMARY KEY",
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

                            tableColumn.default =
                                dbColumn["COLUMN_DEFAULT"] !== null &&
                                dbColumn["COLUMN_DEFAULT"] !== undefined
                                    ? this.removeParenthesisFromDefault(
                                          dbColumn["COLUMN_DEFAULT"],
                                      )
                                    : undefined
                            tableColumn.isNullable =
                                dbColumn["IS_NULLABLE"] === "YES"
                            tableColumn.isUnique =
                                uniqueConstraints.length > 0 &&
                                !isConstraintComposite
                            tableColumn.isGenerated = isGenerated
                            if (isGenerated)
                                tableColumn.generationStrategy = "increment"
                            if (tableColumn.default === "newsequentialid()") {
                                tableColumn.isGenerated = true
                                tableColumn.generationStrategy = "uuid"
                                tableColumn.default = undefined
                            }

                            // todo: unable to get default charset
                            // tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                            if (dbColumn["COLLATION_NAME"])
                                tableColumn.collation =
                                    dbColumn["COLLATION_NAME"] ===
                                    defaultCollation["COLLATION_NAME"]
                                        ? undefined
                                        : dbColumn["COLLATION_NAME"]

                            if (
                                tableColumn.type === "datetime2" ||
                                tableColumn.type === "time" ||
                                tableColumn.type === "datetimeoffset"
                            ) {
                                tableColumn.precision =
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["DATETIME_PRECISION"],
                                    )
                                        ? dbColumn["DATETIME_PRECISION"]
                                        : undefined
                            }

                            if (
                                dbColumn["is_persisted"] !== null &&
                                dbColumn["is_persisted"] !== undefined &&
                                dbColumn["definition"]
                            ) {
                                tableColumn.generatedType =
                                    dbColumn["is_persisted"] === true
                                        ? "STORED"
                                        : "VIRTUAL"
                                // We cannot relay on information_schema.columns.generation_expression, because it is formatted different.
                                const asExpressionQuery =
                                    this.selectTypeormMetadataSql({
                                        database: dbTable["TABLE_CATALOG"],
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

                            return tableColumn
                        }),
                )

                // find unique constraints of table, group them by constraint name and build TableUnique.
                const tableUniqueConstraints = OrmUtils.uniq(
                    dbConstraints.filter(
                        (dbConstraint) =>
                            dbConstraint["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbConstraint["TABLE_SCHEMA"] ===
                                dbTable["TABLE_SCHEMA"] &&
                            dbConstraint["TABLE_CATALOG"] ===
                                dbTable["TABLE_CATALOG"] &&
                            dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE",
                    ),
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
                    dbConstraints.filter(
                        (dbConstraint) =>
                            dbConstraint["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbConstraint["TABLE_SCHEMA"] ===
                                dbTable["TABLE_SCHEMA"] &&
                            dbConstraint["TABLE_CATALOG"] ===
                                dbTable["TABLE_CATALOG"] &&
                            dbConstraint["CONSTRAINT_TYPE"] === "CHECK",
                    ),
                    (dbConstraint) => dbConstraint["CONSTRAINT_NAME"],
                )

                table.checks = tableCheckConstraints
                    .filter(
                        (constraint) =>
                            !this.isEnumCheckConstraint(
                                constraint["CONSTRAINT_NAME"],
                            ),
                    )
                    .map((constraint) => {
                        const checks = dbConstraints.filter(
                            (dbC) =>
                                dbC["CONSTRAINT_NAME"] ===
                                constraint["CONSTRAINT_NAME"],
                        )
                        return new TableCheck({
                            name: constraint["CONSTRAINT_NAME"],
                            columnNames: checks.map((c) => c["COLUMN_NAME"]),
                            expression: constraint["definition"],
                        })
                    })

                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils.uniq(
                    dbForeignKeys.filter(
                        (dbForeignKey) =>
                            dbForeignKey["TABLE_NAME"] ===
                                dbTable["TABLE_NAME"] &&
                            dbForeignKey["TABLE_SCHEMA"] ===
                                dbTable["TABLE_SCHEMA"] &&
                            dbForeignKey["TABLE_CATALOG"] ===
                                dbTable["TABLE_CATALOG"],
                    ),
                    (dbForeignKey) => dbForeignKey["FK_NAME"],
                )

                table.foreignKeys = tableForeignKeyConstraints.map(
                    (dbForeignKey) => {
                        const foreignKeys = dbForeignKeys.filter(
                            (dbFk) =>
                                dbFk["FK_NAME"] === dbForeignKey["FK_NAME"],
                        )

                        // if referenced table located in currently used db and schema, we don't need to concat db and schema names to table name.
                        const db =
                            dbForeignKey["TABLE_CATALOG"] === currentDatabase
                                ? undefined
                                : dbForeignKey["TABLE_CATALOG"]
                        const schema = getSchemaFromKey(
                            dbForeignKey,
                            "REF_SCHEMA",
                        )
                        const referencedTableName = this.driver.buildTableName(
                            dbForeignKey["REF_TABLE"],
                            schema,
                            db,
                        )

                        return new TableForeignKey({
                            name: dbForeignKey["FK_NAME"],
                            columnNames: foreignKeys.map(
                                (dbFk) => dbFk["COLUMN_NAME"],
                            ),
                            referencedDatabase: dbForeignKey["TABLE_CATALOG"],
                            referencedSchema: dbForeignKey["REF_SCHEMA"],
                            referencedTableName: referencedTableName,
                            referencedColumnNames: foreignKeys.map(
                                (dbFk) => dbFk["REF_COLUMN"],
                            ),
                            onDelete: dbForeignKey["ON_DELETE"].replace(
                                "_",
                                " ",
                            ), // SqlServer returns NO_ACTION, instead of NO ACTION
                            onUpdate: dbForeignKey["ON_UPDATE"].replace(
                                "_",
                                " ",
                            ), // SqlServer returns NO_ACTION, instead of NO ACTION
                        })
                    },
                )

                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils.uniq(
                    dbIndices.filter(
                        (dbIndex) =>
                            dbIndex["TABLE_NAME"] === dbTable["TABLE_NAME"] &&
                            dbIndex["TABLE_SCHEMA"] ===
                                dbTable["TABLE_SCHEMA"] &&
                            dbIndex["TABLE_CATALOG"] ===
                                dbTable["TABLE_CATALOG"],
                    ),
                    (dbIndex) => dbIndex["INDEX_NAME"],
                )

                table.indices = tableIndexConstraints.map((constraint) => {
                    const indices = dbIndices.filter((index) => {
                        return (
                            index["TABLE_CATALOG"] ===
                                constraint["TABLE_CATALOG"] &&
                            index["TABLE_SCHEMA"] ===
                                constraint["TABLE_SCHEMA"] &&
                            index["TABLE_NAME"] === constraint["TABLE_NAME"] &&
                            index["INDEX_NAME"] === constraint["INDEX_NAME"]
                        )
                    })
                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map((i) => i["COLUMN_NAME"]),
                        isUnique: constraint["IS_UNIQUE"],
                        where: constraint["CONDITION"],
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
            .map((column) =>
                this.buildCreateColumnSql(table, column, false, true),
            )
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
                    if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`
                    if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`

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
        const parsedName = this.driver.parseTableName(view)

        // Can't use `escapePath` here because `CREATE VIEW` does not accept database names.
        const viewIdentifier = parsedName.schema
            ? `"${parsedName.schema}"."${parsedName.tableName}"`
            : `"${parsedName.tableName}"`

        if (typeof view.expression === "string") {
            return new Query(
                `CREATE VIEW ${viewIdentifier} AS ${view.expression}`,
            )
        } else {
            return new Query(
                `CREATE VIEW ${viewIdentifier} AS ${view
                    .expression(this.connection)
                    .getQuery()}`,
            )
        }
    }

    protected async insertViewDefinitionSql(view: View): Promise<Query> {
        const parsedTableName = this.driver.parseTableName(view)

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema()
        }

        const expression =
            typeof view.expression === "string"
                ? view.expression.trim()
                : view.expression(this.connection).getQuery()
        return this.insertTypeormMetadataSql({
            type: MetadataTableType.VIEW,
            database: parsedTableName.database,
            schema: parsedTableName.schema,
            name: parsedTableName.tableName,
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
        const parsedTableName = this.driver.parseTableName(viewOrPath)

        if (!parsedTableName.schema) {
            parsedTableName.schema = await this.getCurrentSchema()
        }

        return this.deleteTypeormMetadataSql({
            type: MetadataTableType.VIEW,
            database: parsedTableName.database,
            schema: parsedTableName.schema,
            name: parsedTableName.tableName,
        })
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
            }" ON ${this.escapePath(table)} (${columns}) ${
                index.where ? "WHERE " + index.where : ""
            }`,
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
            `DROP INDEX "${indexName}" ON ${this.escapePath(table)}`,
        )
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
            )} DROP CONSTRAINT "${foreignKeyName}"`,
        )
    }

    /**
     * Escapes given table or View path.
     */
    protected escapePath(target: Table | View | string): string {
        const { database, schema, tableName } =
            this.driver.parseTableName(target)

        if (database && database !== this.driver.database) {
            if (schema && schema !== this.driver.searchSchema) {
                return `"${database}"."${schema}"."${tableName}"`
            }

            return `"${database}".."${tableName}"`
        }

        if (schema && schema !== this.driver.searchSchema) {
            return `"${schema}"."${tableName}"`
        }

        return `"${tableName}"`
    }

    /**
     * Concat database name and schema name to the foreign key name.
     * Needs because FK name is relevant to the schema and database.
     */
    protected buildForeignKeyName(
        fkName: string,
        schemaName: string | undefined,
        dbName: string | undefined,
    ): string {
        let joinedFkName = fkName
        if (schemaName && schemaName !== this.driver.searchSchema)
            joinedFkName = schemaName + "." + joinedFkName
        if (dbName && dbName !== this.driver.database)
            joinedFkName = dbName + "." + joinedFkName

        return joinedFkName
    }

    /**
     * Removes parenthesis around default value.
     * Sql server returns default value with parenthesis around, e.g.
     *  ('My text') - for string
     *  ((1)) - for number
     *  (newsequentialId()) - for function
     */
    protected removeParenthesisFromDefault(defaultValue: string): any {
        if (defaultValue.substr(0, 1) !== "(") return defaultValue
        const normalizedDefault = defaultValue.substr(
            1,
            defaultValue.lastIndexOf(")") - 1,
        )
        return this.removeParenthesisFromDefault(normalizedDefault)
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(
        table: Table,
        column: TableColumn,
        skipIdentity: boolean,
        createDefault: boolean,
        skipEnum?: boolean,
    ) {
        let c = `"${column.name}" ${this.connection.driver.createFullType(
            column,
        )}`

        if (!skipEnum && column.enum) {
            const expression = this.getEnumExpression(column)
            const checkName =
                this.connection.namingStrategy.checkConstraintName(
                    table,
                    expression,
                    true,
                )
            c += ` CONSTRAINT ${checkName} CHECK(${expression})`
        }

        if (column.collation) c += " COLLATE " + column.collation

        if (column.asExpression) {
            c += ` AS (${column.asExpression})`
            if (column.generatedType === "STORED") {
                c += ` PERSISTED`

                // NOT NULL can be specified for computed columns only if PERSISTED is also specified
                if (column.isNullable !== true) c += " NOT NULL"
            }
        } else {
            if (column.isNullable !== true) c += " NOT NULL"
        }

        if (
            column.isGenerated === true &&
            column.generationStrategy === "increment" &&
            !skipIdentity
        )
            // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)"

        if (
            column.default !== undefined &&
            column.default !== null &&
            createDefault
        ) {
            // we create named constraint to be able to delete this constraint when column been dropped
            const defaultName =
                this.connection.namingStrategy.defaultConstraintName(
                    table,
                    column.name,
                )
            c += ` CONSTRAINT "${defaultName}" DEFAULT ${column.default}`
        }

        if (
            column.isGenerated &&
            column.generationStrategy === "uuid" &&
            !column.default
        ) {
            // we create named constraint to be able to delete this constraint when column been dropped
            const defaultName =
                this.connection.namingStrategy.defaultConstraintName(
                    table,
                    column.name,
                )
            c += ` CONSTRAINT "${defaultName}" DEFAULT NEWSEQUENTIALID()`
        }
        return c
    }

    private getEnumExpression(column: TableColumn) {
        if (!column.enum) {
            throw new Error(`Enum is not defined in column ${column.name}`)
        }
        return (
            column.name +
            " IN (" +
            column.enum.map((val) => "'" + val + "'").join(",") +
            ")"
        )
    }

    protected isEnumCheckConstraint(name: string): boolean {
        return name.indexOf("CHK_") !== -1 && name.indexOf("_ENUM") !== -1
    }

    /**
     * Converts MssqlParameter into real mssql parameter type.
     */
    protected mssqlParameterToNativeParameter(parameter: MssqlParameter): any {
        switch (this.driver.normalizeType({ type: parameter.type as any })) {
            case "bit":
                return this.driver.mssql.Bit
            case "bigint":
                return this.driver.mssql.BigInt
            case "decimal":
                return this.driver.mssql.Decimal(...parameter.params)
            case "float":
                return this.driver.mssql.Float
            case "int":
                return this.driver.mssql.Int
            case "money":
                return this.driver.mssql.Money
            case "numeric":
                return this.driver.mssql.Numeric(...parameter.params)
            case "smallint":
                return this.driver.mssql.SmallInt
            case "smallmoney":
                return this.driver.mssql.SmallMoney
            case "real":
                return this.driver.mssql.Real
            case "tinyint":
                return this.driver.mssql.TinyInt
            case "char":
                if (
                    this.driver.options.options
                        ?.disableAsciiToUnicodeParamConversion
                ) {
                    return this.driver.mssql.Char(...parameter.params)
                }
                return this.driver.mssql.NChar(...parameter.params)
            case "nchar":
                return this.driver.mssql.NChar(...parameter.params)
            case "text":
                if (
                    this.driver.options.options
                        ?.disableAsciiToUnicodeParamConversion
                ) {
                    return this.driver.mssql.Text
                }
                return this.driver.mssql.Ntext
            case "ntext":
                return this.driver.mssql.Ntext
            case "varchar":
                if (
                    this.driver.options.options
                        ?.disableAsciiToUnicodeParamConversion
                ) {
                    return this.driver.mssql.VarChar(...parameter.params)
                }
                return this.driver.mssql.NVarChar(...parameter.params)
            case "nvarchar":
                return this.driver.mssql.NVarChar(...parameter.params)
            case "xml":
                return this.driver.mssql.Xml
            case "time":
                return this.driver.mssql.Time(...parameter.params)
            case "date":
                return this.driver.mssql.Date
            case "datetime":
                return this.driver.mssql.DateTime
            case "datetime2":
                return this.driver.mssql.DateTime2(...parameter.params)
            case "datetimeoffset":
                return this.driver.mssql.DateTimeOffset(...parameter.params)
            case "smalldatetime":
                return this.driver.mssql.SmallDateTime
            case "uniqueidentifier":
                return this.driver.mssql.UniqueIdentifier
            case "variant":
                return this.driver.mssql.Variant
            case "binary":
                return this.driver.mssql.Binary
            case "varbinary":
                return this.driver.mssql.VarBinary(...parameter.params)
            case "image":
                return this.driver.mssql.Image
            case "udt":
                return this.driver.mssql.UDT
            case "rowversion":
                return this.driver.mssql.RowVersion
        }
    }

    /**
     * Converts string literal of isolation level to enum.
     * The underlying mssql driver requires an enum for the isolation level.
     */
    convertIsolationLevel(isolation: IsolationLevel) {
        const ISOLATION_LEVEL = this.driver.mssql.ISOLATION_LEVEL
        switch (isolation) {
            case "READ UNCOMMITTED":
                return ISOLATION_LEVEL.READ_UNCOMMITTED
            case "REPEATABLE READ":
                return ISOLATION_LEVEL.REPEATABLE_READ
            case "SERIALIZABLE":
                return ISOLATION_LEVEL.SERIALIZABLE

            case "READ COMMITTED":
            default:
                return ISOLATION_LEVEL.READ_COMMITTED
        }
    }

    /**
     * Change table comment.
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `sqlserver driver does not support change table comment.`,
        )
    }
}
