import { QueryRunner } from "../../query-runner/QueryRunner"
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner"
import { ReadStream } from "../../platform/PlatformTools"
import { Table } from "../../schema-builder/table/Table"
import { TableCheck } from "../../schema-builder/table/TableCheck"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableExclusion } from "../../schema-builder/table/TableExclusion"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { TableIndex } from "../../schema-builder/table/TableIndex"
import { TableUnique } from "../../schema-builder/table/TableUnique"
import { View } from "../../schema-builder/view/View"
import { IsolationLevel } from "../types/IsolationLevel"
import { YdbDriver } from "./YdbDriver"
import { ReplicationMode } from "../types/ReplicationMode"
import {
    DriverNotInitialized,
    QueryFailedError,
    QueryRunnerAlreadyReleasedError,
    TransactionAlreadyStartedError,
    TransactionNotStartedError,
    TypeORMError,
} from "../../error"
import { Broadcaster } from "../../subscriber/Broadcaster"
import * as Ydb from "ydb-sdk"
import { QueryResult } from "../../query-runner/QueryResult"

interface IQueryParams {
    [k: string]: Ydb.Ydb.ITypedValue
}

class ParsedQueryResult extends Ydb.TypedData {
    constructor(obj: any) {
        super(obj)
    }
}

export class YdbQueryRunner extends BaseQueryRunner implements QueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: YdbDriver

    /**
     * Ydb Sdk underlying library
     */
    Ydb: {
        Driver: typeof Ydb.Driver
        Session: typeof Ydb.Session
    }

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    databaseConnection: Ydb.Driver

    /** */
    sessionTransaction: null | {
        session: Ydb.Session
        txId: string
        resolve: (value: void | PromiseLike<void>) => void
        reject: (reason?: any) => void
    } = null

    constructor(ydbDriver: YdbDriver, replicationMode: ReplicationMode) {
        super()
        this.driver = ydbDriver
        if (!this.driver.driver) {
            throw new DriverNotInitialized("ydb")
        }

        this.connection = ydbDriver.connection
        this.broadcaster = new Broadcaster(this)
    }

    /**
     * Executes a given SQL query with optional parameters.
     */
    async query(
        query: string,
        parameters?: any[] | undefined,
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        this.driver.connection.logger.logQuery(query, parameters, this)

        const databaseConnection = await this.connect()

        let typedParams: IQueryParams = {}
        function isQueryParam(item: any): item is IQueryParams {
            return item[0]?.hasOwnProperty("type") === true
        }
        if (parameters?.length && isQueryParam(parameters[0])) {
            Object.assign(typedParams, parameters[0])
        } else {
            parameters?.map((val, ind) => {
                Object.assign(typedParams, {
                    ["$param" + ind.toString()]: Ydb.TypedValues.string(val),
                })
            })
        }

        const queryStartTime = +new Date()
        let raw: Ydb.Ydb.Table.ExecuteQueryResult | object[]
        const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime
        let queryEndTime: number

        try {
            raw = await databaseConnection.tableClient.withSession(
                async (session) => {
                    return await session.executeQuery(query, typedParams)
                },
            )

            queryEndTime = +new Date()
        } catch (err) {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
            throw new QueryFailedError(query, parameters, err)
        }

        // log slow queries if maxQueryExecution time is set
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

        if (!useStructuredResult) {
            return raw
        }

        const result = new QueryResult()
        result.raw = raw
        result.records = raw.resultSets.map((resultSet) =>
            ParsedQueryResult.createNativeObjects(resultSet),
        )
        return result
    }

    protected loadTables(tablePaths?: string[] | undefined): Promise<Table[]> {
        // TODO: Needs implementation
        if (tablePaths && tablePaths.length > 0) {
            throw new Error("Method not implemented.")
        } else {
            return Promise.resolve([])
        }
    }

    protected loadViews(tablePaths?: string[] | undefined): Promise<View[]> {
        // TODO: Needs implementation
        if (tablePaths && tablePaths.length > 0) {
            throw new Error("Method not implemented.")
        } else {
            return Promise.resolve([])
        }
    }

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    async connect(): Promise<Ydb.Driver> {
        if (this.databaseConnection) return this.databaseConnection

        if (!this.driver.driver) {
            throw new DriverNotInitialized("ydb")
        }
        if (!this.databaseConnection) {
            this.databaseConnection = this.driver.driver
        }

        this.isReleased = false
        return this.databaseConnection
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    async release(): Promise<void> {}

    async clearDatabase(database?: string | undefined): Promise<void> {
        const result = await this.driver.driver?.schemeClient.listDirectory("/")

        await this.driver.driver?.tableClient.withSession(async (session) => {
            result?.children.forEach((table) => {
                session.dropTable(table.name as string)
            })
        })
    }

    /**
     * Starts transaction inside of new session
     *
     * Supported levels: `"SERIALIZABLE"`, `"ONLINE READ ONLY"`, `"STALE READ ONLY"`, `"SNAPSHOT READ ONLY"`
     * * 'SERIALIZABLE' isolationLevel is not the same as mentioned in wiki, but is similar to YDB's Serializable
     */
    async startTransaction(
        isolationLevel?: IsolationLevel | undefined,
    ): Promise<void> {
        // TODO: Add tests
        if (this.isTransactionActive || this.sessionTransaction)
            throw new TransactionAlreadyStartedError()

        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        await this.connect()
        await this.createSessionTransaction(isolationLevel)
    }

    async createSessionTransaction(
        isolationLevel?: IsolationLevel | undefined,
    ): Promise<void> {
        let transactionSettings: Ydb.Ydb.Table.ITransactionSettings = {}

        if (isolationLevel === "SERIALIZABLE" || !isolationLevel)
            transactionSettings = { serializableReadWrite: {} }

        if (isolationLevel === "ONLINE READ ONLY")
            transactionSettings = {
                onlineReadOnly: { allowInconsistentReads: false },
            }

        if (isolationLevel === "STALE READ ONLY")
            transactionSettings = {
                staleReadOnly: {},
            }

        if (isolationLevel === "SNAPSHOT READ ONLY")
            transactionSettings = {
                snapshotReadOnly: {},
            }

        if (
            isolationLevel === "REPEATABLE READ" ||
            isolationLevel === "READ COMMITTED" ||
            isolationLevel === "READ UNCOMMITTED"
        )
            throw new TypeORMError(
                `${isolationLevel} transactions are not supported by YDB`,
            )

        return new Promise(
            (startTransactionResolve, startTransactionReject) => {
                try {
                    this.databaseConnection.tableClient.withSession(
                        (session) => {
                            return new Promise(async (resolve, reject) => {
                                const tx = await session.beginTransaction(
                                    transactionSettings,
                                )
                                this.connection.logger.logQuery(
                                    "START TRANSACTION",
                                )

                                this.sessionTransaction = {
                                    session,
                                    txId: tx.id as string,
                                    resolve,
                                    reject,
                                }
                                startTransactionResolve()
                            })
                        },
                    )
                } catch (error) {
                    startTransactionReject(error)
                }
            },
        )
    }

    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive || !this.sessionTransaction)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        await this.sessionTransaction.session.commitTransaction({
            txId: this.sessionTransaction.txId,
        })
        this.connection.logger.logQuery("COMMIT")

        this.sessionTransaction.resolve()
        this.sessionTransaction = null
        this.isTransactionActive = false

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive || !this.sessionTransaction)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        await this.sessionTransaction.session.rollbackTransaction({
            txId: this.sessionTransaction.txId,
        })
        this.connection.logger.logQuery("ROLLBACK")

        this.sessionTransaction.resolve()
        this.sessionTransaction = null
        this.isTransactionActive = false

        await this.broadcaster.broadcast("AfterTransactionRollback")
    }

    stream(
        query: string,
        parameters?: any[] | undefined,
        onEnd?: Function | undefined,
        onError?: Function | undefined,
    ): Promise<ReadStream> {
        throw new Error("Method not implemented.")
    }

    getDatabases(): Promise<string[]> {
        throw new Error("Method not implemented.")
    }

    getSchemas(database?: string | undefined): Promise<string[]> {
        throw new Error("Method not implemented.")
    }

    hasDatabase(database: string): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    getCurrentDatabase(): Promise<string | undefined> {
        throw new Error("Method not implemented.")
    }

    hasSchema(schema: string): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    getCurrentSchema(): Promise<string | undefined> {
        throw new Error("Method not implemented.")
    }

    hasTable(table: string | Table): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    hasColumn(table: string | Table, columnName: string): Promise<boolean> {
        throw new Error("Method not implemented.")
    }

    createDatabase(
        database: string,
        ifNotExist?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropDatabase(
        database: string,
        ifExist?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createSchema(
        schemaPath: string,
        ifNotExist?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropSchema(
        schemaPath: string,
        ifExist?: boolean | undefined,
        isCascade?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createTable(
        table: Table,
        ifNotExist?: boolean | undefined,
        createForeignKeys?: boolean | undefined,
        createIndices?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropTable(
        table: string | Table,
        ifExist?: boolean | undefined,
        dropForeignKeys?: boolean | undefined,
        dropIndices?: boolean | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createView(
        view: View,
        syncWithMetadata?: boolean | undefined,
        oldView?: View | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropView(view: string | View): Promise<void> {
        throw new Error("Method not implemented.")
    }

    renameTable(
        oldTableOrName: string | Table,
        newTableName: string,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    addColumn(table: string | Table, column: TableColumn): Promise<void> {
        throw new Error("Method not implemented.")
    }

    addColumns(table: string | Table, columns: TableColumn[]): Promise<void> {
        throw new Error("Method not implemented.")
    }

    renameColumn(
        table: string | Table,
        oldColumnOrName: string | TableColumn,
        newColumnOrName: string | TableColumn,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    changeColumn(
        table: string | Table,
        oldColumn: string | TableColumn,
        newColumn: TableColumn,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    changeColumns(
        table: string | Table,
        changedColumns: { oldColumn: TableColumn; newColumn: TableColumn }[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropColumn(
        table: string | Table,
        column: string | TableColumn,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropColumns(
        table: string | Table,
        columns: TableColumn[] | string[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createPrimaryKey(
        table: string | Table,
        columnNames: string[],
        constraintName?: string | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    updatePrimaryKeys(
        table: string | Table,
        columns: TableColumn[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropPrimaryKey(
        table: string | Table,
        constraintName?: string | undefined,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createUniqueConstraint(
        table: string | Table,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createUniqueConstraints(
        table: string | Table,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropUniqueConstraint(
        table: string | Table,
        uniqueOrName: string | TableUnique,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropUniqueConstraints(
        table: string | Table,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createCheckConstraint(
        table: string | Table,
        checkConstraint: TableCheck,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createCheckConstraints(
        table: string | Table,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropCheckConstraint(
        table: string | Table,
        checkOrName: string | TableCheck,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropCheckConstraints(
        table: string | Table,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createExclusionConstraint(
        table: string | Table,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createExclusionConstraints(
        table: string | Table,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropExclusionConstraint(
        table: string | Table,
        exclusionOrName: string | TableExclusion,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropExclusionConstraints(
        table: string | Table,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createForeignKey(
        table: string | Table,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createForeignKeys(
        table: string | Table,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropForeignKey(
        table: string | Table,
        foreignKeyOrName: string | TableForeignKey,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropForeignKeys(
        table: string | Table,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createIndex(table: string | Table, index: TableIndex): Promise<void> {
        throw new Error("Method not implemented.")
    }

    createIndices(table: string | Table, indices: TableIndex[]): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropIndex(
        table: string | Table,
        index: string | TableIndex,
    ): Promise<void> {
        throw new Error("Method not implemented.")
    }

    dropIndices(table: string | Table, indices: TableIndex[]): Promise<void> {
        throw new Error("Method not implemented.")
    }

    clearTable(tableName: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
}
