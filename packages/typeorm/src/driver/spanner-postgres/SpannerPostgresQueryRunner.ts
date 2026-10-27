import { Transform } from "node:stream"
import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { Table } from "../../schema-builder/table/Table"
import { TableCheck } from "../../schema-builder/table/TableCheck"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { TableIndex } from "../../schema-builder/table/TableIndex"
import { TableUnique } from "../../schema-builder/table/TableUnique"
import type { View } from "../../schema-builder/view/View"
import type { ReadStream } from "../../platform/PlatformTools"
import { DateUtils } from "../../util/DateUtils"
import { OrmUtils } from "../../util/OrmUtils"
import { Query } from "../Query"
import { SpannerQueryRunner } from "../spanner/SpannerQueryRunner"
import type { ColumnType } from "../types/ColumnTypes"
import type { IsolationLevel } from "../types/IsolationLevel"
import type { SpannerPostgresDriver } from "./SpannerPostgresDriver"

/**
 * Runs queries on a single Spanner database connection that uses the
 * PostgreSQL dialect.
 *
 * Sessions, transactions and query execution are inherited from
 * {@link SpannerQueryRunner}; this class adds the PostgreSQL dialect DDL, the
 * schema introspection and the batching of the DDL statements.
 *
 * Spanner runs DDL through its Admin API, outside of any transaction, and
 * applies a batch of statements as a single schema update. Creating an index
 * in the same batch as its table takes minutes less than creating it
 * afterwards, and every update has a high fixed cost. So the DDL statements are
 * not sent one by one: they are queued, and sent together, with one
 * `updateSchema` call, when something needs their effect:
 * - a statement that is not DDL, or any read of the schema, is about to run,
 *   on this query runner or on another one of the same data source;
 * - a transaction starts or commits;
 * - a migration ends, or the query runner is released;
 * - {@link flushDdl} is called.
 *
 * This means a failed DDL statement is reported by the call that sends the
 * batch, not by the one that queued the statement. The statements queued in a
 * transaction that is rolled back are discarded; the ones already sent
 * cannot be undone, as Spanner DDL is not transactional. So the statements
 * queued in a transaction are only sent by this query runner.
 *
 * @see https://cloud.google.com/spanner/docs/schema-updates
 */
export class SpannerPostgresQueryRunner extends SpannerQueryRunner {
    /**
     * Database driver used by connection.
     */
    declare driver: SpannerPostgresDriver

    /**
     * A write run outside of a user transaction begins its transaction inline,
     * together with the statement.
     */
    protected explicitBegin: boolean = false

    /**
     * DDL statements waiting to be sent to Spanner in a single batch.
     */
    protected pendingDdl: string[] = []

    /**
     * The batch of DDL statements that is being sent to Spanner, if any.
     */
    protected ddlFlush?: Promise<void>

    /**
     * Schemas that belong to Spanner, which TypeORM never reads as user tables.
     */
    protected readonly systemSchemas = [
        "information_schema",
        "pg_catalog",
        "spanner_sys",
    ]

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Starts transaction. Nested transactions are not supported, as Spanner has
     * no SAVEPOINT.
     *
     * The DDL queued so far is sent first: it does not belong to the
     * transaction.
     *
     * @param isolationLevel
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (this.isTransactionActive) throw new TransactionAlreadyStartedError()

        await this.flushDdl()

        return super.startTransaction(isolationLevel)
    }

    /**
     * Commits transaction, after sending the DDL queued in it.
     */
    async commitTransaction(): Promise<void> {
        if (this.isTransactionActive) await this.flushDdl()

        return super.commitTransaction()
    }

    /**
     * Rollbacks transaction. The DDL queued in it is discarded.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isTransactionActive) this.discardDdl()

        return super.rollbackTransaction()
    }

    /**
     * Releases used database connection, after sending the DDL queued.
     * You cannot use query runner methods once its released.
     */
    async release(): Promise<void> {
        try {
            await this.flushDdl()
        } finally {
            await super.release()
        }
    }

    /**
     * Sends the DDL queued at the end of a migration.
     */
    async afterMigration(): Promise<void> {
        await this.flushDdl()
    }

    /**
     * Executes a given SQL query.
     *
     * A DDL statement (`CREATE`, `ALTER`, `DROP`, …) is queued to be sent to
     * Spanner along with the other DDL statements, and returns no rows: it
     * cannot run as a query. Any other statement is run after the DDL queued
     * has been sent.
     *
     * @param query
     * @param parameters
     * @param useStructuredResult
     */
    async query(
        query: string,
        parameters?: any[] | ObjectLiteral,
        useStructuredResult: boolean = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        if (this.isDdlQuery(query)) {
            if (Array.isArray(parameters) ? parameters.length : parameters)
                throw new TypeORMError(
                    `Spanner does not accept parameters in a DDL statement: ${query}`,
                )

            await this.updateDDL(query)
            return useStructuredResult ? new QueryResult() : []
        }

        await this.flushAllDdl()

        return super.query(query, parameters, useStructuredResult)
    }

    /**
     * Returns raw data stream, after sending the DDL queued. The values of
     * each row are converted like the ones `query()` returns.
     *
     * @param query
     * @param parameters
     * @param onEnd
     * @param onError
     */
    async stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ) {
        await this.flushAllDdl()

        const source = await super.stream(query, parameters)
        const normalized = new Transform({
            objectMode: true,
            transform: (row: ObjectLiteral, _encoding, callback) => {
                for (const key of Object.keys(row)) {
                    row[key] = this.driver.normalizeRawValue(row[key])
                }
                callback(null, row)
            },
        })
        // a failure of the source ends the stream returned to the caller
        source.on("error", (error: Error) => normalized.destroy(error))
        source.pipe(normalized)

        if (onEnd) normalized.on("end", onEnd as () => void)
        if (onError) normalized.on("error", onError as (error: Error) => void)

        return normalized as unknown as ReadStream
    }

    /**
     * Gets the Spanner object a stream runs its query on: the transaction of
     * this query runner when there is one, so the stream sees its writes.
     */
    protected getStreamExecutor(): any {
        return this.isTransactionActive && this.sessionTransaction
            ? this.sessionTransaction
            : super.getStreamExecutor()
    }

    /**
     * Queues a DDL statement to be sent to Spanner with the next batch, see
     * {@link flushDdl}.
     *
     * @param query
     * @param _parameters
     */
    async updateDDL(query: string, _parameters?: any[]): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        this.pendingDdl.push(query)
        this.driver.queryRunnersWithDdl.add(this)
    }

    /**
     * Sends the DDL statements queued to Spanner, all together in a single
     * schema update, and waits for it to complete. Does nothing when no
     * statement is queued.
     *
     * It is called whenever the effect of the queued statements is needed, so
     * it is only required to get the errors of the statements at a given
     * point.
     */
    async flushDdl(): Promise<void> {
        // statements sent by another call must be applied before returning
        if (this.ddlFlush) await this.ddlFlush
        if (this.pendingDdl.length === 0) return

        const statements = this.pendingDdl
        this.pendingDdl = []
        this.driver.queryRunnersWithDdl.delete(this)

        this.ddlFlush = this.updateSchema(statements)
        try {
            await this.ddlFlush
        } catch (error) {
            // the tables remembered may have changes that were not applied
            this.loadedTables = []
            throw error
        } finally {
            this.ddlFlush = undefined
        }
    }

    /**
     * Discards the DDL statements queued and not sent yet, so the ones of a
     * failed operation are not sent when the query runner is released.
     */
    discardDdl(): void {
        this.pendingDdl = []
        this.driver.queryRunnersWithDdl.delete(this)
        // the tables remembered may have the changes discarded
        this.loadedTables = []
    }

    /**
     * Sends the DDL queued by this query runner and by the other query runners
     * of the data source, so a statement sees the schema changes queued
     * before it. The DDL another query runner queued in a transaction stays
     * queued, as a rollback of the transaction discards it.
     */
    protected async flushAllDdl(): Promise<void> {
        for (const queryRunner of [...this.driver.queryRunnersWithDdl]) {
            if (queryRunner !== this && !queryRunner.isTransactionActive)
                await queryRunner.flushDdl()
        }
        await this.flushDdl()
    }

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql(): Promise<void> {
        await super.executeMemoryUpSql()
        await this.flushDdl()
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql(): Promise<void> {
        await super.executeMemoryDownSql()
        await this.flushDdl()
    }

    /**
     * Returns all available schema names including the default one, but not
     * the ones of Spanner.
     *
     * @param _database
     */
    async getSchemas(_database?: string): Promise<string[]> {
        const rows = await this.queryInformationSchema(
            `SELECT "schema_name" FROM "information_schema"."schemata" ` +
                `WHERE "schema_name" NOT IN (${this.systemSchemasSql})`,
        )
        return rows.map((row) => row["schema_name"])
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<string> {
        return this.driver.options.databaseId as string
    }

    /**
     * Loads currently using database schema, the one Spanner resolves the
     * names without schema to.
     */
    async getCurrentSchema(): Promise<string> {
        return this.driver.searchSchema
    }

    /**
     * Checks if schema with the given name exist.
     *
     * @param schema
     */
    async hasSchema(schema: string): Promise<boolean> {
        const rows = await this.queryInformationSchema(
            `SELECT 1 FROM "information_schema"."schemata" WHERE "schema_name" = $1`,
            [this.getSchemaName(schema)],
        )
        return rows.length > 0
    }

    /**
     * Checks if table with the given name exist in the database.
     *
     * @param tableOrName
     */
    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const { schema, tableName } = this.driver.parseTableName(tableOrName)
        const rows = await this.queryInformationSchema(
            `SELECT 1 FROM "information_schema"."tables" WHERE "table_schema" = $1 AND "table_name" = $2`,
            [schema, tableName],
        )
        return rows.length > 0
    }

    /**
     * Checks if column with the given name exist in the given table.
     *
     * @param tableOrName
     * @param columnName
     */
    async hasColumn(
        tableOrName: Table | string,
        columnName: string,
    ): Promise<boolean> {
        const { schema, tableName } = this.driver.parseTableName(tableOrName)
        const rows = await this.queryInformationSchema(
            `SELECT 1 FROM "information_schema"."columns" WHERE "table_schema" = $1 AND "table_name" = $2 AND "column_name" = $3`,
            [schema, tableName, columnName],
        )
        return rows.length > 0
    }

    /**
     * Checks if database with the given name exist.
     *
     * @param _database
     */
    async hasDatabase(_database: string): Promise<boolean> {
        throw new TypeORMError(
            `Spanner databases are not managed by a database connection: use the Spanner Admin API.`,
        )
    }

    /**
     * Creates a new database. Not supported: a Spanner database belongs to an
     * instance and is created with the Admin API.
     *
     * @param _database
     * @param _ifNotExists
     */
    async createDatabase(
        _database: string,
        _ifNotExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner databases are not managed by a database connection: create it with the Spanner Admin API, using the PostgreSQL dialect.`,
        )
    }

    /**
     * Drops database. Not supported: a Spanner database belongs to an instance
     * and is dropped with the Admin API.
     *
     * @param _database
     * @param _ifExists
     */
    async dropDatabase(_database: string, _ifExists?: boolean): Promise<void> {
        throw new TypeORMError(
            `Spanner databases are not managed by a database connection: drop it with the Spanner Admin API.`,
        )
    }

    /**
     * Creates a new table schema.
     *
     * @param schemaPath
     * @param ifNotExists
     */
    async createSchema(
        schemaPath: string,
        ifNotExists?: boolean,
    ): Promise<void> {
        const schema = this.getSchemaName(schemaPath)
        // IF NOT EXISTS is not part of the Spanner CREATE SCHEMA syntax
        if (ifNotExists && (await this.hasSchema(schema))) return

        const escapedSchema = this.driver.escape(schema)
        await this.executeQueries(
            new Query(`CREATE SCHEMA ${escapedSchema}`),
            new Query(`DROP SCHEMA ${escapedSchema}`),
        )
    }

    /**
     * Drops table schema. Spanner cannot drop a schema that has tables.
     *
     * @param schemaPath
     * @param ifExists
     * @param isCascade
     */
    async dropSchema(
        schemaPath: string,
        ifExists?: boolean,
        isCascade?: boolean,
    ): Promise<void> {
        if (isCascade)
            throw new TypeORMError(
                `Spanner does not support DROP SCHEMA ... CASCADE: drop the tables of the schema first.`,
            )

        const schema = this.getSchemaName(schemaPath)
        if (ifExists && !(await this.hasSchema(schema))) return

        const escapedSchema = this.driver.escape(schema)
        await this.executeQueries(
            new Query(`DROP SCHEMA ${escapedSchema}`),
            new Query(`CREATE SCHEMA ${escapedSchema}`),
        )
    }

    /**
     * Creates a new table, with its indexes and foreign keys.
     *
     * The table is remembered, so the following changes to it, by name, do not
     * have to read it from Spanner, which would send the DDL queued.
     *
     * @param table
     * @param ifNotExists
     * @param createForeignKeys
     * @param createIndices
     */
    async createTable(
        table: Table,
        ifNotExists: boolean = false,
        createForeignKeys: boolean = true,
        createIndices: boolean = true,
    ): Promise<void> {
        if (ifNotExists && (await this.hasTable(table))) return

        await super.createTable(table, false, createForeignKeys, createIndices)

        const createdTable = table.clone()
        if (!createForeignKeys) createdTable.foreignKeys = []
        if (!createIndices) createdTable.indices = []
        this.forgetTable(createdTable)
        this.loadedTables.push(createdTable)
    }

    /**
     * Drops the table, after dropping its indexes and foreign keys: Spanner does
     * not drop a table that has indexes.
     *
     * @param target
     * @param ifExists
     * @param dropForeignKeys
     * @param dropIndices
     */
    async dropTable(
        target: Table | string,
        ifExists?: boolean,
        dropForeignKeys: boolean = true,
        dropIndices: boolean = true,
    ): Promise<void> {
        await super.dropTable(target, ifExists, dropForeignKeys, dropIndices)

        this.forgetTable(target)
    }

    /**
     * Creates a new view. Not supported: TypeORM keeps the definition of a view
     * in the `typeorm_metadata` table, which cannot hold it in Spanner because
     * the columns of its primary key are not nullable.
     *
     * @param _view
     */
    async createView(_view: View): Promise<void> {
        throw new TypeORMError(
            `Views are not supported by the spanner-postgres driver.`,
        )
    }

    /**
     * Drops the view. Not supported, see {@link createView}.
     *
     * @param _target
     * @param _ifExists
     */
    async dropView(_target: View | string, _ifExists?: boolean): Promise<void> {
        throw new TypeORMError(
            `Views are not supported by the spanner-postgres driver.`,
        )
    }

    /**
     * Renames the given table. The names of its indexes and constraints do not
     * change, as Spanner cannot rename them.
     *
     * @param oldTableOrName
     * @param newTableName
     */
    async renameTable(
        oldTableOrName: Table | string,
        newTableName: string,
    ): Promise<void> {
        const oldTable =
            oldTableOrName instanceof Table
                ? oldTableOrName
                : await this.getCachedTable(oldTableOrName)
        const newTable = oldTable.clone()

        const { schema, tableName } = this.driver.parseTableName(oldTable)
        const newName = this.driver.parseTableName(newTableName)
        if (newTableName.includes(".") && newName.schema !== schema)
            throw new TypeORMError(
                `Spanner cannot move the table "${oldTable.name}" to another schema.`,
            )

        newTable.name = this.driver.buildTableName(
            newName.tableName,
            newTable.name.includes(".") ? schema : undefined,
        )

        await this.executeQueries(
            new Query(
                `ALTER TABLE ${this.escapePath(oldTable)} RENAME TO ${this.driver.escape(newName.tableName)}`,
            ),
            new Query(
                `ALTER TABLE ${this.escapePath(newTable)} RENAME TO ${this.driver.escape(tableName)}`,
            ),
        )
        this.replaceCachedTable(oldTable, newTable)
    }

    /**
     * Renames column in the given table. Not supported: Spanner cannot rename a
     * column, and recreating it would lose its data.
     *
     * @param tableOrName
     * @param oldTableColumnOrName
     * @param _newTableColumnOrName
     */
    async renameColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        _newTableColumnOrName: TableColumn | string,
    ): Promise<void> {
        throw new TypeORMError(
            `Spanner cannot rename the column "${
                typeof oldTableColumnOrName === "string"
                    ? oldTableColumnOrName
                    : oldTableColumnOrName.name
            }" of the table "${
                typeof tableOrName === "string" ? tableOrName : tableOrName.name
            }": add a new column, copy the data and drop the old one.`,
        )
    }

    /**
     * Changes a column in the table: its length, nullability, default value or
     * uniqueness. Spanner cannot change anything else about a column, so it
     * is never recreated, as that would lose its data.
     *
     * @param tableOrName
     * @param oldTableColumnOrName
     * @param newColumn
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
        const clonedTable = table.clone()
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

        if (oldColumn.name !== newColumn.name)
            return this.renameColumn(table, oldColumn, newColumn)

        // compare the types as Spanner names them, so aliases like varchar are equal
        if (
            this.driver.normalizeType({
                type: oldColumn.type as ColumnType,
            }) !==
                this.driver.normalizeType({
                    type: newColumn.type as ColumnType,
                }) ||
            !!oldColumn.isArray !== !!newColumn.isArray ||
            oldColumn.isPrimary !== newColumn.isPrimary ||
            oldColumn.generatedType !== newColumn.generatedType ||
            oldColumn.asExpression !== newColumn.asExpression
        )
            throw new TypeORMError(
                `Spanner cannot change the type, the primary key or the generated expression of the column "${newColumn.name}" of the table "${table.name}": drop and add the column, or create a new table.`,
            )

        const isTypeChanged =
            oldColumn.length !== newColumn.length ||
            (oldColumn.isNullable !== newColumn.isNullable &&
                !newColumn.isPrimary)
        const isDefaultChanged = !this.driver.compareDefaultValues(
            this.driver.getDefaultExpression(oldColumn),
            this.driver.getDefaultExpression(newColumn),
        )

        if (
            isTypeChanged &&
            (this.isIdentityColumn(oldColumn) ||
                this.isIdentityColumn(newColumn))
        )
            throw new TypeORMError(
                `Spanner cannot change the nullability of the identity column "${newColumn.name}" of the table "${table.name}".`,
            )

        // ALTER COLUMN ... TYPE redefines the column: it drops its default value,
        // which has to be set again. The down queries run in reverse order.
        const hasNewDefault = this.buildDefaultSql(newColumn) !== undefined
        const hasOldDefault = this.buildDefaultSql(oldColumn) !== undefined
        if (isTypeChanged)
            upQueries.push(this.alterColumnTypeSql(table, newColumn))
        if (
            hasNewDefault
                ? isDefaultChanged || isTypeChanged
                : isDefaultChanged && !isTypeChanged
        )
            upQueries.push(this.alterColumnDefaultSql(table, newColumn))
        if (
            hasOldDefault
                ? isDefaultChanged || isTypeChanged
                : isDefaultChanged && !isTypeChanged
        )
            downQueries.push(this.alterColumnDefaultSql(table, oldColumn))
        if (isTypeChanged)
            downQueries.push(this.alterColumnTypeSql(table, oldColumn))

        if (newColumn.isUnique !== oldColumn.isUnique) {
            if (newColumn.isUnique === true) {
                const uniqueIndex = new TableIndex({
                    name: this.dataSource.namingStrategy.indexName(table, [
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
                const uniqueIndex = clonedTable.indices.find(
                    (index) =>
                        index.columnNames.length === 1 &&
                        index.isUnique === true &&
                        index.columnNames[0] === newColumn.name,
                )
                if (uniqueIndex) {
                    clonedTable.indices.splice(
                        clonedTable.indices.indexOf(uniqueIndex),
                        1,
                    )
                    const tableUnique = clonedTable.uniques.find(
                        (unique) => unique.name === uniqueIndex.name,
                    )
                    if (tableUnique)
                        clonedTable.uniques.splice(
                            clonedTable.uniques.indexOf(tableUnique),
                            1,
                        )

                    upQueries.push(this.dropIndexSql(table, uniqueIndex))
                    downQueries.push(this.createIndexSql(table, uniqueIndex))
                }
            }
        }

        await this.executeQueries(upQueries, downQueries)

        const clonedColumn = clonedTable.columns.find(
            (column) => column.name === oldColumn.name,
        )
        if (clonedColumn) {
            clonedColumn.length = newColumn.length
            clonedColumn.isNullable = newColumn.isNullable
            clonedColumn.default = newColumn.default
            clonedColumn.isGenerated = newColumn.isGenerated
            clonedColumn.generationStrategy = newColumn.generationStrategy
            clonedColumn.isUnique = newColumn.isUnique
        }
        this.replaceCachedTable(table, clonedTable)
    }

    /**
     * Creates a new primary key. Not supported: the keys of a table cannot
     * change.
     *
     * @param _tableOrName
     * @param _columnNames
     */
    async createPrimaryKey(
        _tableOrName: Table | string,
        _columnNames: string[],
    ): Promise<void> {
        throw this.primaryKeyChangeError()
    }

    /**
     * Updates composite primary keys. Not supported: the keys of a table cannot
     * change.
     *
     * @param _tableOrName
     * @param _columns
     */
    async updatePrimaryKeys(
        _tableOrName: Table | string,
        _columns: TableColumn[],
    ): Promise<void> {
        throw this.primaryKeyChangeError()
    }

    /**
     * Drops a primary key. Not supported: the keys of a table cannot change.
     *
     * @param _tableOrName
     * @param _constraintName
     * @param _ifExists
     */
    async dropPrimaryKey(
        _tableOrName: Table | string,
        _constraintName?: string,
        _ifExists?: boolean,
    ): Promise<void> {
        throw this.primaryKeyChangeError()
    }

    /**
     * Creates new unique constraint. Spanner has no unique constraints, so it
     * is created as a unique index, as TypeORM does for a table definition.
     *
     * @param tableOrName
     * @param uniqueConstraint
     */
    async createUniqueConstraint(
        tableOrName: Table | string,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName)

        uniqueConstraint.name ??=
            this.dataSource.namingStrategy.uniqueConstraintName(
                table,
                uniqueConstraint.columnNames,
            )

        await this.createIndex(
            table,
            new TableIndex({
                name: uniqueConstraint.name,
                columnNames: uniqueConstraint.columnNames,
                isUnique: true,
            }),
        )
    }

    /**
     * Creates new unique constraints, as unique indexes.
     *
     * @param tableOrName
     * @param uniqueConstraints
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
     * Drops unique constraint, which is a unique index.
     *
     * @param tableOrName
     * @param uniqueOrName
     * @param ifExists
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
        ifExists?: boolean,
    ): Promise<void> {
        await this.dropIndex(
            tableOrName,
            uniqueOrName instanceof TableUnique
                ? uniqueOrName.name!
                : uniqueOrName,
            ifExists,
        )
    }

    /**
     * Drops unique constraints, which are unique indexes.
     *
     * @param tableOrName
     * @param uniqueConstraints
     * @param ifExists
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
        ifExists?: boolean,
    ): Promise<void> {
        for (const uniqueConstraint of [...uniqueConstraints]) {
            await this.dropUniqueConstraint(
                tableOrName,
                uniqueConstraint,
                ifExists,
            )
        }
    }

    /**
     * Clears all table contents.
     * Spanner does not support TRUNCATE TABLE statement, so we use DELETE FROM.
     *
     * @param tableName
     * @param options
     * @param options.cascade
     */
    async clearTable(
        tableName: string,
        options?: { cascade?: boolean },
    ): Promise<void> {
        if (options?.cascade) {
            throw new TypeORMError(
                `Spanner does not support clearing table with cascade option`,
            )
        }
        await this.query(`DELETE FROM ${this.escapePath(tableName)} WHERE true`)
    }

    /**
     * Removes all tables from the currently connected database: its foreign
     * keys, indexes and tables, which are dropped in a single schema update.
     * The schemas are kept.
     */
    async clearDatabase(): Promise<void> {
        const [foreignKeys, indices, tables] = await Promise.all([
            this.queryInformationSchema(
                `SELECT "table_schema", "table_name", "constraint_name" ` +
                    `FROM "information_schema"."table_constraints" ` +
                    `WHERE "constraint_type" = 'FOREIGN KEY' AND "table_schema" NOT IN (${this.systemSchemasSql})`,
            ),
            this.queryInformationSchema(
                `SELECT "table_schema", "index_name" FROM "information_schema"."indexes" ` +
                    `WHERE "index_type" <> 'PRIMARY_KEY' AND "spanner_is_managed" = 'NO' ` +
                    `AND "table_schema" NOT IN (${this.systemSchemasSql})`,
            ),
            this.queryInformationSchema(
                `SELECT "table_schema", "table_name" FROM "information_schema"."tables" ` +
                    `WHERE "table_type" = 'BASE TABLE' AND "table_schema" NOT IN (${this.systemSchemasSql})`,
            ),
        ])

        for (const fk of foreignKeys) {
            await this.updateDDL(
                `ALTER TABLE ${this.escapeObject(fk["table_schema"], fk["table_name"])} ` +
                    `DROP CONSTRAINT ${this.driver.escape(fk["constraint_name"])}`,
            )
        }
        for (const index of indices) {
            await this.updateDDL(
                `DROP INDEX ${this.escapeObject(index["table_schema"], index["index_name"])}`,
            )
        }
        for (const table of tables) {
            await this.updateDDL(
                `DROP TABLE ${this.escapeObject(table["table_schema"], table["table_name"])}`,
            )
        }

        await this.flushDdl()
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Builds the named parameters object sent to Spanner along with the query.
     * In the PostgreSQL dialect `$1` is bound to the parameter named `p1`.
     *
     * @param parameters
     */
    protected buildQueryParameters(
        parameters?: any[],
    ): ObjectLiteral | undefined {
        return parameters
            ? parameters.reduce((params, value, index) => {
                  params["p" + (index + 1)] = value === undefined ? null : value
                  return params
              }, {} as ObjectLiteral)
            : undefined
    }

    /**
     * Builds the request sent to Spanner to run a query. 64-bit integers are
     * read as wrapped values, as they can be larger than a safe integer, and
     * the type of the parameters the client cannot infer is given.
     *
     * @param query
     * @param parameters
     */
    protected buildQueryRequest(
        query: string,
        parameters?: any[],
    ): ObjectLiteral {
        const request = super.buildQueryRequest(query, parameters)
        request.jsonOptions = { wrapNumbers: true }

        const types: ObjectLiteral = {}
        parameters?.forEach((value, index) => {
            const type = this.getParameterType(value)
            if (type) types["p" + (index + 1)] = type
        })
        if (Object.keys(types).length > 0) request.types = types

        return request
    }

    /**
     * Gets the Spanner type of a parameter the client library cannot infer
     * from its value: a null, or an array without a first non-null item. The
     * items of an array of a column are typed by the column.
     *
     * A null parameter is bound as text, so it needs a cast
     * (`$1::bigint`) when it is not compared with, or assigned to, a text
     * value. The queries built by TypeORM write nulls as a NULL literal.
     *
     * @param value
     */
    protected getParameterType(value: any): string | ObjectLiteral | undefined {
        if (value === null || value === undefined) return "string"

        if (Array.isArray(value)) {
            const itemType = this.driver.getArrayItemType(value)
            if (itemType || value.length === 0 || value[0] == null)
                return {
                    type: "array",
                    child:
                        itemType ??
                        this.getItemType(value.find((item) => item != null)),
                }
        }

        return undefined
    }

    /**
     * Gets the Spanner type of an array item.
     *
     * @param item
     */
    protected getItemType(item: any): string | ObjectLiteral {
        const { Int, Float, Float32, PGNumeric, SpannerDate } =
            this.driver.spannerLib

        if (typeof item === "number") {
            return Number.isInteger(item) ? "int64" : "float64"
        } else if (typeof item === "boolean") {
            return "bool"
        } else if (item instanceof Date) {
            return "timestamp"
        } else if (Buffer.isBuffer(item)) {
            return "bytes"
        } else if (item instanceof Int) {
            return "int64"
        } else if (item instanceof Float) {
            return "float64"
        } else if (item instanceof Float32) {
            return "float32"
        } else if (item instanceof PGNumeric) {
            return { type: "pgNumeric" }
        } else if (item instanceof SpannerDate) {
            return "date"
        }

        return "string"
    }

    /**
     * Tells if a query only reads data, so it can run as a single-use read
     * outside of a transaction instead of in a read-write transaction.
     *
     * Leading whitespace and comments are skipped and the keyword is not case
     * sensitive. A `WITH` query is only read-only when it has no data change,
     * and `SELECT ... FOR UPDATE` needs a read-write transaction. The words are
     * looked up anywhere in the query, so a false match, in a literal, only
     * costs a read-write transaction.
     *
     * @param query
     */
    protected isReadOnlyQuery(query: string): boolean {
        const sql = this.skipLeadingComments(query)

        if (!/^(?:select|with)\b/i.test(sql)) return false

        if (/\bfor\s+(?:no\s+key\s+|key\s+)?(?:update|share)\b/i.test(sql))
            return false

        return !(
            /^with\b/i.test(sql) && /\b(?:insert|update|delete)\b/i.test(sql)
        )
    }

    /**
     * Converts the values of a query result, in place, to the plain values
     * the driver returns.
     *
     * @param rawResult
     */
    protected normalizeQueryResult(rawResult: any): void {
        const rows: ObjectLiteral[] | undefined = rawResult?.[0]
        if (!Array.isArray(rows)) return

        for (const row of rows) {
            for (const key of Object.keys(row)) {
                row[key] = this.driver.normalizeRawValue(row[key])
            }
        }
    }

    /**
     * Tells if a statement is DDL, which Spanner only runs through its Admin
     * API: it starts with `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE` or
     * `ANALYZE`.
     *
     * @param query
     */
    protected isDdlQuery(query: string): boolean {
        return /^(?:create|alter|drop|grant|revoke|analyze)\b/i.test(
            this.skipLeadingComments(query),
        )
    }

    /**
     * Tells if a statement has to run as a query, which is any statement that is
     * not DDL.
     *
     * @param query
     */
    protected isDMLQuery(query: string): boolean {
        return !this.isDdlQuery(query)
    }

    /**
     * Skips the whitespace, comments and parentheses a statement starts with.
     *
     * @param query
     */
    protected skipLeadingComments(query: string): string {
        return query.replace(
            /^(?:\s+|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|\()+/,
            "",
        )
    }

    /**
     * Sends a batch of DDL statements to Spanner as a single schema update.
     *
     * @param statements
     */
    protected async updateSchema(statements: string[]): Promise<void> {
        // the statements are reported to the subscribers when they are sent
        for (const statement of statements) {
            this.driver.dataSource.logger.logQuery(statement, undefined, this)
            await this.broadcaster.broadcast(
                "BeforeQuery",
                statement,
                undefined,
            )
        }

        const query = statements.join(";\n")
        const broadcasterResult = new BroadcasterResult()
        try {
            const queryStartTime = DateUtils.performanceNow()
            const [operation] =
                await this.driver.instanceDatabase.updateSchema(statements)
            await operation.promise()

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryExecutionTime =
                DateUtils.performanceNow() - queryStartTime
            for (const statement of statements) {
                this.broadcaster.broadcastAfterQueryEvent(
                    broadcasterResult,
                    statement,
                    undefined,
                    true,
                    queryExecutionTime,
                    undefined,
                    undefined,
                )
            }
            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            )
                this.driver.dataSource.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    undefined,
                    this,
                )
        } catch (err) {
            this.driver.dataSource.logger.logQueryError(
                err,
                query,
                undefined,
                this,
            )
            for (const statement of statements) {
                this.broadcaster.broadcastAfterQueryEvent(
                    broadcasterResult,
                    statement,
                    undefined,
                    false,
                    undefined,
                    undefined,
                    err,
                )
            }
            throw new QueryFailedError(query, undefined, err)
        } finally {
            await broadcasterResult.wait()
        }
    }

    /**
     * Reads the information schema, after sending the DDL queued.
     *
     * Spanner rejects a read of the information schema in a read-write
     * transaction, or after a write in it, so it is always a single-use read
     * outside of the transaction of this query runner.
     *
     * @param query
     * @param parameters
     */
    protected async queryInformationSchema(
        query: string,
        parameters?: any[],
    ): Promise<ObjectLiteral[]> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        await this.flushAllDdl()

        this.driver.dataSource.logger.logQuery(query, parameters, this)
        try {
            const rawResult = await this.driver.instanceDatabase.run(
                this.buildQueryRequest(query, parameters),
            )
            this.normalizeQueryResult(rawResult)
            return rawResult[0]
        } catch (err) {
            this.driver.dataSource.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
            throw new QueryFailedError(query, parameters, err)
        }
    }

    /**
     * The names of the schemas of Spanner, as a SQL list.
     */
    protected get systemSchemasSql(): string {
        return this.systemSchemas
            .map((schema) => this.escapeLiteral(schema))
            .join(", ")
    }

    /**
     * Escapes a string as a SQL literal.
     *
     * @param value
     */
    protected escapeLiteral(value: string): string {
        return `'${value.replaceAll("'", "''")}'`
    }

    /**
     * Gets the name of a schema from a schema path, which can start with the
     * name of a database.
     *
     * @param schemaPath
     */
    protected getSchemaName(schemaPath: string): string {
        return schemaPath.indexOf(".") === -1
            ? schemaPath
            : schemaPath.split(".")[1]
    }

    /**
     * Gets a table by name, from the tables this query runner created or read.
     *
     * @param tableName
     */
    protected async getCachedTable(tableName: string): Promise<Table> {
        const tablePath = this.getTablePath(tableName)

        return (
            this.loadedTables.find(
                (table) => this.getTablePath(table) === tablePath,
            ) ?? super.getCachedTable(tableName)
        )
    }

    /**
     * Removes a table from the tables this query runner remembers.
     *
     * @param target
     */
    protected forgetTable(target: Table | string): void {
        const tablePath = this.getTablePath(target)

        this.loadedTables = this.loadedTables.filter(
            (table) => this.getTablePath(table) !== tablePath,
        )
    }

    /**
     * Builds the error of a primary key change, which Spanner does not allow.
     */
    protected primaryKeyChangeError(): TypeORMError {
        return new TypeORMError(
            `The keys of a Spanner table cannot change: you cannot add a key column to an existing table, remove one, or change the primary key.`,
        )
    }

    /**
     * Loads all views (with given names) from the database. There is none, as
     * views are not supported.
     *
     * @param _viewNames
     */
    protected async loadViews(_viewNames?: string[]): Promise<View[]> {
        return []
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     *
     * @param tableNames
     */
    protected async loadTables(tableNames?: string[]): Promise<Table[]> {
        if (tableNames?.length === 0) {
            return []
        }

        const tablesCondition = tableNames
            ? ` AND (${tableNames
                  .map((tableName) => this.driver.parseTableName(tableName))
                  .map(
                      ({ schema, tableName }) =>
                          `("table_schema" = ${this.escapeLiteral(schema!)} AND "table_name" = ${this.escapeLiteral(tableName)})`,
                  )
                  .join(" OR ")})`
            : ""
        const dbTables = await this.queryInformationSchema(
            `SELECT "table_schema", "table_name" FROM "information_schema"."tables" ` +
                `WHERE "table_type" = 'BASE TABLE' AND "table_schema" NOT IN (${this.systemSchemasSql})${tablesCondition}`,
        )

        // if tables were not found in the db, no need to proceed
        if (dbTables.length === 0) return []

        const condition = (schemaColumn: string, tableColumn: string) =>
            dbTables
                .map(
                    (dbTable) =>
                        `(${schemaColumn} = ${this.escapeLiteral(dbTable["table_schema"])} AND ${tableColumn} = ${this.escapeLiteral(dbTable["table_name"])})`,
                )
                .join(" OR ")

        const columnsSql =
            `SELECT "table_schema", "table_name", "column_name", "column_default", "is_nullable", "is_identity", "spanner_type" ` +
            `FROM "information_schema"."columns" WHERE ${condition('"table_schema"', '"table_name"')} ` +
            `ORDER BY "ordinal_position"`

        const primaryKeysSql =
            `SELECT "kcu"."table_schema", "kcu"."table_name", "kcu"."column_name" ` +
            `FROM "information_schema"."table_constraints" "tc" ` +
            `INNER JOIN "information_schema"."key_column_usage" "kcu" ON "kcu"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "kcu"."constraint_name" = "tc"."constraint_name" ` +
            `WHERE "tc"."constraint_type" = 'PRIMARY KEY' AND (${condition('"tc"."table_schema"', '"tc"."table_name"')}) ` +
            `ORDER BY "kcu"."ordinal_position"`

        // the indexes that Spanner creates to enforce a foreign key are managed by Spanner
        const indicesSql =
            `SELECT "i"."table_schema", "i"."table_name", "i"."index_name", "i"."is_unique", "i"."is_null_filtered", "ic"."column_name" ` +
            `FROM "information_schema"."indexes" "i" ` +
            `INNER JOIN "information_schema"."index_columns" "ic" ON "ic"."table_schema" = "i"."table_schema" ` +
            `AND "ic"."table_name" = "i"."table_name" AND "ic"."index_name" = "i"."index_name" ` +
            `WHERE "i"."index_type" <> 'PRIMARY_KEY' AND "i"."spanner_is_managed" = 'NO' AND "ic"."ordinal_position" IS NOT NULL ` +
            `AND (${condition('"i"."table_schema"', '"i"."table_name"')}) ` +
            `ORDER BY "ic"."ordinal_position"`

        const checksSql =
            `SELECT "tc"."table_schema", "tc"."table_name", "cc"."constraint_name", "cc"."check_clause", "ccu"."column_name" ` +
            `FROM "information_schema"."table_constraints" "tc" ` +
            `INNER JOIN "information_schema"."check_constraints" "cc" ON "cc"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "cc"."constraint_name" = "tc"."constraint_name" ` +
            `LEFT JOIN "information_schema"."constraint_column_usage" "ccu" ON "ccu"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "ccu"."constraint_name" = "tc"."constraint_name" ` +
            `WHERE "tc"."constraint_type" = 'CHECK' AND "tc"."constraint_name" NOT LIKE 'CK_IS_NOT_NULL%' ` +
            `AND (${condition('"tc"."table_schema"', '"tc"."table_name"')})`

        const foreignKeysSql =
            `SELECT "tc"."table_schema", "tc"."table_name", "tc"."constraint_name", "kcu"."column_name", ` +
            `"ctu"."table_schema" AS "referenced_table_schema", "ctu"."table_name" AS "referenced_table_name", "rc"."delete_rule", "rc"."update_rule" ` +
            `FROM "information_schema"."table_constraints" "tc" ` +
            `INNER JOIN "information_schema"."key_column_usage" "kcu" ON "kcu"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "kcu"."constraint_name" = "tc"."constraint_name" ` +
            `INNER JOIN "information_schema"."referential_constraints" "rc" ON "rc"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "rc"."constraint_name" = "tc"."constraint_name" ` +
            `INNER JOIN "information_schema"."constraint_table_usage" "ctu" ON "ctu"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "ctu"."constraint_name" = "tc"."constraint_name" ` +
            `WHERE "tc"."constraint_type" = 'FOREIGN KEY' AND (${condition('"tc"."table_schema"', '"tc"."table_name"')}) ` +
            `ORDER BY "kcu"."ordinal_position"`

        // the referenced columns are the columns of the primary key, or of the unique index, the foreign key references
        const referencedColumnsSql =
            `SELECT "rc"."constraint_schema", "rc"."constraint_name", "k"."column_name", "k"."ordinal_position" ` +
            `FROM "information_schema"."table_constraints" "tc" ` +
            `INNER JOIN "information_schema"."referential_constraints" "rc" ON "rc"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "rc"."constraint_name" = "tc"."constraint_name" ` +
            `INNER JOIN "information_schema"."key_column_usage" "k" ON "k"."constraint_schema" = "rc"."unique_constraint_schema" ` +
            `AND "k"."constraint_name" = "rc"."unique_constraint_name" ` +
            `WHERE "tc"."constraint_type" = 'FOREIGN KEY' AND (${condition('"tc"."table_schema"', '"tc"."table_name"')}) ` +
            `UNION ALL ` +
            `SELECT "rc"."constraint_schema", "rc"."constraint_name", "ic"."column_name", "ic"."ordinal_position" ` +
            `FROM "information_schema"."table_constraints" "tc" ` +
            `INNER JOIN "information_schema"."referential_constraints" "rc" ON "rc"."constraint_schema" = "tc"."constraint_schema" ` +
            `AND "rc"."constraint_name" = "tc"."constraint_name" ` +
            `INNER JOIN "information_schema"."index_columns" "ic" ON "ic"."table_schema" = "rc"."unique_constraint_schema" ` +
            `AND "ic"."index_name" = "rc"."unique_constraint_name" ` +
            `WHERE "tc"."constraint_type" = 'FOREIGN KEY' AND (${condition('"tc"."table_schema"', '"tc"."table_name"')}) ` +
            `ORDER BY 1, 2, 4`

        const [
            dbColumns,
            dbPrimaryKeys,
            dbIndices,
            dbChecks,
            dbForeignKeys,
            dbReferencedColumns,
        ] = await Promise.all([
            this.queryInformationSchema(columnsSql),
            this.queryInformationSchema(primaryKeysSql),
            this.queryInformationSchema(indicesSql),
            this.queryInformationSchema(checksSql),
            this.queryInformationSchema(foreignKeysSql),
            this.queryInformationSchema(referencedColumnsSql),
        ])

        const isTable = (row: ObjectLiteral, dbTable: ObjectLiteral) =>
            row["table_schema"] === dbTable["table_schema"] &&
            row["table_name"] === dbTable["table_name"]

        // the schema is part of the name of a table that is not in the default schema
        const getNameSchema = (schema: string) =>
            schema === this.driver.searchSchema &&
            this.driver.schema === this.driver.searchSchema
                ? undefined
                : schema

        return dbTables.map((dbTable) => {
            const table = new Table()
            table.schema = dbTable["table_schema"]
            table.name = this.driver.buildTableName(
                dbTable["table_name"],
                getNameSchema(dbTable["table_schema"]),
            )

            const tableIndices = dbIndices.filter((row) =>
                isTable(row, dbTable),
            )
            const tableMetadata = this.dataSource.entityMetadatas.find(
                (metadata) =>
                    this.getTablePath(table) === this.getTablePath(metadata),
            )

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter((dbColumn) => isTable(dbColumn, dbTable))
                .map((dbColumn) => {
                    const columnUniqueIndices = tableIndices.filter(
                        (dbIndex) =>
                            dbIndex["column_name"] ===
                                dbColumn["column_name"] &&
                            dbIndex["is_unique"] === "YES",
                    )
                    const hasIgnoredIndex =
                        columnUniqueIndices.length > 0 &&
                        tableMetadata?.indices.some((index) =>
                            columnUniqueIndices.some(
                                (uniqueIndex) =>
                                    index.name === uniqueIndex["index_name"] &&
                                    index.synchronize === false,
                            ),
                        )
                    const isConstraintComposite = columnUniqueIndices.every(
                        (uniqueIndex) =>
                            tableIndices.some(
                                (dbIndex) =>
                                    dbIndex["index_name"] ===
                                        uniqueIndex["index_name"] &&
                                    dbIndex["column_name"] !==
                                        dbColumn["column_name"],
                            ),
                    )

                    const tableColumn = new TableColumn()
                    tableColumn.name = dbColumn["column_name"]

                    // the type is `character varying(36)`, or `bigint[]`
                    let fullType: string =
                        dbColumn["spanner_type"].toLowerCase()
                    if (fullType.endsWith("[]")) {
                        tableColumn.isArray = true
                        fullType = fullType.slice(0, -2)
                    }
                    const length = /\((\d+)\)$/.exec(fullType)
                    tableColumn.type = length
                        ? fullType.slice(0, length.index)
                        : fullType
                    tableColumn.length = length?.[1] ?? ""

                    tableColumn.isNullable = dbColumn["is_nullable"] === "YES"
                    tableColumn.isPrimary = dbPrimaryKeys.some(
                        (dbPrimaryKey) =>
                            isTable(dbPrimaryKey, dbTable) &&
                            dbPrimaryKey["column_name"] ===
                                dbColumn["column_name"],
                    )
                    tableColumn.isUnique =
                        columnUniqueIndices.length > 0 &&
                        !hasIgnoredIndex &&
                        !isConstraintComposite

                    const defaultValue = this.driver.normalizeDatabaseDefault(
                        dbColumn["column_default"],
                    )
                    if (
                        defaultValue !== undefined &&
                        /^\(?spanner\.generate_uuid\(\)\)?(::uuid)?$/i.test(
                            defaultValue,
                        )
                    ) {
                        tableColumn.isGenerated = true
                        tableColumn.generationStrategy = "uuid"
                    } else {
                        tableColumn.default = defaultValue
                    }
                    if (dbColumn["is_identity"] === "YES") {
                        tableColumn.isGenerated = true
                        tableColumn.generationStrategy = "increment"
                    }

                    return tableColumn
                })

            table.indices = OrmUtils.uniq(
                tableIndices,
                (dbIndex) => dbIndex["index_name"],
            ).map(
                (dbIndex) =>
                    new TableIndex({
                        name: dbIndex["index_name"],
                        columnNames: tableIndices
                            .filter(
                                (index) =>
                                    index["index_name"] ===
                                    dbIndex["index_name"],
                            )
                            .map((index) => index["column_name"]),
                        isUnique: dbIndex["is_unique"] === "YES",
                        isNullFiltered: dbIndex["is_null_filtered"] === "YES",
                    }),
            )

            const tableChecks = dbChecks.filter((row) => isTable(row, dbTable))
            table.checks = OrmUtils.uniq(
                tableChecks,
                (dbCheck) => dbCheck["constraint_name"],
            ).map(
                (dbCheck) =>
                    new TableCheck({
                        name: dbCheck["constraint_name"],
                        columnNames: tableChecks
                            .filter(
                                (check) =>
                                    check["constraint_name"] ===
                                    dbCheck["constraint_name"],
                            )
                            .map((check) => check["column_name"])
                            .filter((columnName) => !!columnName),
                        expression: dbCheck["check_clause"],
                    }),
            )

            const tableForeignKeys = dbForeignKeys.filter((row) =>
                isTable(row, dbTable),
            )
            table.foreignKeys = OrmUtils.uniq(
                tableForeignKeys,
                (dbForeignKey) => dbForeignKey["constraint_name"],
            ).map((dbForeignKey) => {
                const referencedSchema = dbForeignKey["referenced_table_schema"]
                return new TableForeignKey({
                    name: dbForeignKey["constraint_name"],
                    columnNames: tableForeignKeys
                        .filter(
                            (fk) =>
                                fk["constraint_name"] ===
                                dbForeignKey["constraint_name"],
                        )
                        .map((fk) => fk["column_name"]),
                    referencedSchema,
                    referencedTableName: this.driver.buildTableName(
                        dbForeignKey["referenced_table_name"],
                        getNameSchema(referencedSchema),
                    ),
                    referencedColumnNames: dbReferencedColumns
                        .filter(
                            (column) =>
                                column["constraint_schema"] ===
                                    dbTable["table_schema"] &&
                                column["constraint_name"] ===
                                    dbForeignKey["constraint_name"],
                        )
                        .map((column) => column["column_name"]),
                    onDelete: dbForeignKey["delete_rule"],
                    onUpdate: dbForeignKey["update_rule"],
                })
            })

            return table
        })
    }

    /**
     * Builds create table sql.
     *
     * Spanner has no unique constraints, so the unique columns and the unique
     * constraints of the table are created as unique indexes.
     *
     * @param table
     * @param createForeignKeys
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): Query {
        const primaryColumns = table.columns.filter(
            (column) => column.isPrimary,
        )
        if (primaryColumns.length === 0)
            throw new TypeORMError(
                `Spanner requires a primary key: the table "${table.name}" has none.`,
            )

        table.columns
            .filter((column) => column.isUnique)
            .forEach((column) => {
                const isUniqueIndexExist = table.indices.some(
                    (index) =>
                        index.columnNames.length === 1 &&
                        !!index.isUnique &&
                        index.columnNames.indexOf(column.name) !== -1,
                )
                const isUniqueConstraintExist = table.uniques.some(
                    (unique) =>
                        unique.columnNames.length === 1 &&
                        unique.columnNames.indexOf(column.name) !== -1,
                )
                if (!isUniqueIndexExist && !isUniqueConstraintExist)
                    table.indices.push(
                        new TableIndex({
                            name: this.dataSource.namingStrategy.uniqueConstraintName(
                                table,
                                [column.name],
                            ),
                            columnNames: [column.name],
                            isUnique: true,
                        }),
                    )
            })

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

        const definitions = table.columns.map((column) =>
            this.buildCreateColumnSql(column),
        )

        table.checks.forEach((check) => {
            const checkName =
                check.name ??
                this.dataSource.namingStrategy.checkConstraintName(
                    table,
                    check.expression!,
                )
            definitions.push(
                `CONSTRAINT ${this.driver.escape(checkName)} CHECK (${check.expression})`,
            )
        })

        if (createForeignKeys) {
            table.foreignKeys.forEach((fk) => {
                fk.name ??= this.dataSource.namingStrategy.foreignKeyName(
                    table,
                    fk.columnNames,
                    this.getTablePath(fk),
                    fk.referencedColumnNames,
                )
                definitions.push(
                    `CONSTRAINT ${this.driver.escape(fk.name)} ${this.buildForeignKeySql(fk)}`,
                )
            })
        }

        definitions.push(
            `PRIMARY KEY (${primaryColumns
                .map((column) => this.driver.escape(column.name))
                .join(", ")})`,
        )

        return new Query(
            `CREATE TABLE ${this.escapePath(table)} (${definitions.join(", ")})`,
        )
    }

    /**
     * Builds create view sql. Views are not supported.
     */
    protected createViewSql(): Query {
        throw new TypeORMError(
            `Views are not supported by the spanner-postgres driver.`,
        )
    }

    /**
     * Builds create index sql. Spanner only accepts the key columns and a
     * `WHERE` with `IS NOT NULL` conditions, no expression, index type or
     * `NULLS NOT DISTINCT`.
     *
     * @param table
     * @param index
     */
    protected createIndexSql(table: Table, index: TableIndex): Query {
        if (index.isSpatial || index.isFulltext || index.type)
            throw new TypeORMError(
                `Spanner only supports ordinary indexes: the index "${index.name}" of the table "${table.name}" cannot be spatial, fulltext or of a type.`,
            )

        const columns = index.columnNames
            .map((columnName) => this.driver.escape(columnName))
            .join(", ")
        // Spanner only filters an index by columns that are not null; a quoted
        // column name can have any character, with its quotes doubled
        const condition = `\\(?\\s*(?:"(?:[^"]|"")+"|[^"\\s()]+)\\s+IS\\s+NOT\\s+NULL\\s*\\)?`
        if (
            index.where &&
            !new RegExp(
                `^\\s*${condition}(?:\\s+AND\\s+${condition})*\\s*$`,
                "i",
            ).test(index.where)
        )
            throw new TypeORMError(
                `Spanner only supports "<column> IS NOT NULL" conditions, joined with AND, in the WHERE clause of an index: the index "${index.name}" of the table "${table.name}" has "${index.where}".`,
            )

        // a null filtered index is an index of the rows that have all its columns
        const where =
            index.where ||
            (index.isNullFiltered
                ? index.columnNames
                      .map(
                          (columnName) =>
                              `${this.driver.escape(columnName)} IS NOT NULL`,
                      )
                      .join(" AND ")
                : "")

        return new Query(
            `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX ${this.driver.escape(
                index.name!,
            )} ON ${this.escapePath(table)} (${columns})${
                where ? ` WHERE ${where}` : ""
            }`,
        )
    }

    /**
     * Builds drop index sql. An index belongs to the schema of its table, which
     * must be part of its name unless it is the default one.
     *
     * @param table
     * @param indexOrName
     */
    protected dropIndexSql(
        table: Table,
        indexOrName: TableIndex | string,
    ): Query {
        const indexName =
            indexOrName instanceof TableIndex ? indexOrName.name : indexOrName
        const { schema } = this.driver.parseTableName(table)

        return new Query(`DROP INDEX ${this.escapeObject(schema, indexName!)}`)
    }

    /**
     * Builds create check constraint sql.
     *
     * @param table
     * @param checkConstraint
     */
    protected createCheckConstraintSql(
        table: Table,
        checkConstraint: TableCheck,
    ): Query {
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT ${this.driver.escape(
                checkConstraint.name!,
            )} CHECK (${checkConstraint.expression})`,
        )
    }

    /**
     * Builds drop check constraint sql.
     *
     * @param table
     * @param checkOrName
     */
    protected dropCheckConstraintSql(
        table: Table,
        checkOrName: TableCheck | string,
    ): Query {
        const checkName =
            checkOrName instanceof TableCheck ? checkOrName.name : checkOrName
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT ${this.driver.escape(
                checkName!,
            )}`,
        )
    }

    /**
     * Builds create foreign key sql.
     *
     * @param table
     * @param foreignKey
     */
    protected createForeignKeySql(
        table: Table,
        foreignKey: TableForeignKey,
    ): Query {
        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT ${this.driver.escape(
                foreignKey.name!,
            )} ${this.buildForeignKeySql(foreignKey)}`,
        )
    }

    /**
     * Builds drop foreign key sql.
     *
     * @param table
     * @param foreignKeyOrName
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
            `ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT ${this.driver.escape(
                foreignKeyName!,
            )}`,
        )
    }

    /**
     * Builds the definition of a foreign key. Spanner only has the `NO ACTION`
     * and `CASCADE` actions on delete, and no action on update.
     *
     * @param foreignKey
     */
    protected buildForeignKeySql(foreignKey: TableForeignKey): string {
        const { onDelete, onUpdate } = foreignKey
        if (
            (onDelete && !["NO ACTION", "CASCADE"].includes(onDelete)) ||
            (onUpdate && onUpdate !== "NO ACTION") ||
            foreignKey.deferrable
        )
            throw new TypeORMError(
                `Spanner foreign keys only support ON DELETE NO ACTION or CASCADE, no ON UPDATE action and are not deferrable: the foreign key "${foreignKey.name}" is not supported.`,
            )

        const columnNames = foreignKey.columnNames
            .map((column) => this.driver.escape(column))
            .join(", ")
        const referencedColumnNames = foreignKey.referencedColumnNames
            .map((column) => this.driver.escape(column))
            .join(", ")

        return (
            `FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(
                this.getTablePath(foreignKey),
            )} (${referencedColumnNames})` +
            (onDelete === "CASCADE" ? " ON DELETE CASCADE" : "")
        )
    }

    /**
     * Escapes given table or view path. The schema is only part of it when it is
     * not the default one.
     *
     * @param target
     */
    protected escapePath(target: Table | View | string): string {
        const { schema, tableName } = this.driver.parseTableName(target)

        return this.escapeObject(schema, tableName)
    }

    /**
     * Escapes the name of a table or index with its schema, which is left out
     * when it is the default one.
     *
     * @param schema
     * @param name
     */
    protected escapeObject(schema: string | undefined, name: string): string {
        return schema && schema !== this.driver.searchSchema
            ? `${this.driver.escape(schema)}.${this.driver.escape(name)}`
            : this.driver.escape(name)
    }

    /**
     * Builds a part of query to create a column: its name, type, nullability and
     * default value.
     *
     * @param column
     */
    protected buildCreateColumnSql(column: TableColumn): string {
        if (column.generatedType)
            throw new TypeORMError(
                `Generated columns are not supported by the spanner-postgres driver: column "${column.name}".`,
            )

        let c = `${this.driver.escape(column.name)} ${this.driver.createFullType(column)}`

        if (this.isIdentityColumn(column))
            c += " GENERATED BY DEFAULT AS IDENTITY (BIT_REVERSED_POSITIVE)"

        if (!column.isNullable) c += " NOT NULL"

        const defaultValue = this.buildDefaultSql(column)
        if (defaultValue !== undefined) c += ` DEFAULT ${defaultValue}`

        return c
    }

    /**
     * Builds the queries that add the given column to an existing table.
     *
     * Spanner only adds a NOT NULL column with a default value, which it also
     * sets to the existing rows. Without one, the column is added as nullable
     * and then made NOT NULL, which fails if the table has rows.
     *
     * @param table
     * @param column
     */
    protected createAddColumnQueries(
        table: Table,
        column: TableColumn,
    ): Query[] {
        if (column.isPrimary)
            throw new TypeORMError(
                `Spanner cannot add the primary key column "${column.name}" to the existing table "${table.name}".`,
            )

        const path = this.escapePath(table)
        if (
            column.isNullable ||
            this.isIdentityColumn(column) ||
            this.buildDefaultSql(column) !== undefined
        )
            return [
                new Query(
                    `ALTER TABLE ${path} ADD COLUMN ${this.buildCreateColumnSql(column)}`,
                ),
            ]

        const nullableColumn = column.clone()
        nullableColumn.isNullable = true
        return [
            new Query(
                `ALTER TABLE ${path} ADD COLUMN ${this.buildCreateColumnSql(nullableColumn)}`,
            ),
            this.alterColumnTypeSql(table, column),
        ]
    }

    /**
     * Builds the query that changes the length and the nullability of a column.
     * Spanner needs both in a single statement, even when one does not change.
     * It redefines the column, so it drops its default value.
     *
     * @see https://cloud.google.com/spanner/docs/reference/postgresql/data-definition-language#alter-table
     * @param table
     * @param column
     */
    protected alterColumnTypeSql(table: Table, column: TableColumn): Query {
        const name = this.driver.escape(column.name)

        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN ${name} TYPE ${this.driver.createFullType(column)}, ` +
                `ALTER COLUMN ${name} ${column.isNullable ? "DROP" : "SET"} NOT NULL`,
        )
    }

    /**
     * Builds the query that sets or drops the default value of a column.
     *
     * @param table
     * @param column
     */
    protected alterColumnDefaultSql(table: Table, column: TableColumn): Query {
        const defaultValue = this.buildDefaultSql(column)

        return new Query(
            `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN ${this.driver.escape(column.name)} ` +
                (defaultValue === undefined
                    ? `DROP DEFAULT`
                    : `SET DEFAULT ${defaultValue}`),
        )
    }

    /**
     * Tells if a column takes its values from an identity column, which is how
     * Spanner implements the `increment` and `identity` generated columns: its
     * values are unique positive integers, but not consecutive, and larger than
     * the largest safe JavaScript integer.
     *
     * @see https://cloud.google.com/spanner/docs/primary-key-default-value#identity-columns
     * @param column
     */
    protected isIdentityColumn(column: TableColumn): boolean {
        if (
            !column.isGenerated ||
            (column.generationStrategy !== "increment" &&
                column.generationStrategy !== "identity")
        )
            return false

        if (
            this.driver.normalizeType({ type: column.type as ColumnType }) !==
            "bigint"
        )
            throw new TypeORMError(
                `Spanner generates the "${column.generationStrategy}" column "${column.name}" with an identity column, which must be a bigint.`,
            )

        return true
    }

    /**
     * Builds the expression of the DEFAULT clause of a column. Spanner generates
     * a uuid with `spanner.generate_uuid()`, and has no default for the other
     * generated columns, which are identity columns or not supported.
     *
     * A literal gets the cast Spanner needs to give it the type of the column.
     *
     * @param column
     */
    protected buildDefaultSql(column: TableColumn): string | undefined {
        if (column.isGenerated) {
            if (column.generationStrategy === "uuid")
                return this.driver.uuidGenerationExpression

            if (this.isIdentityColumn(column)) return undefined

            throw new TypeORMError(
                `Spanner does not support the "${column.generationStrategy}" generated column "${column.name}": use "uuid", "increment" on a bigint column, or generate the value in your application.`,
            )
        }

        if (column.default === undefined || column.default === null)
            return undefined

        const value = String(column.default)
        const type = this.driver.normalizeType({
            type: column.type as ColumnType,
        })
        const isQuoted = /^'.*'$/s.test(value)
        const cast = column.isArray ? `${type}[]` : type

        if (
            isQuoted &&
            [
                "jsonb",
                "bytea",
                "bigint",
                "numeric",
                "double precision",
                "real",
            ].includes(type)
        ) {
            return `${value}::${cast}`
        }

        // Spanner types a decimal literal as numeric
        if (
            (type === "double precision" || type === "real") &&
            /^-?\d+(\.\d+)?$/.test(value)
        )
            return `${value}::${type}`

        return value
    }
}
