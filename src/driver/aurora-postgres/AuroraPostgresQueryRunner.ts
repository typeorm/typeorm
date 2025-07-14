import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { IsolationLevel } from "../types/IsolationLevel"
import { AuroraPostgresDriver } from "./AuroraPostgresDriver"
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner"
import { ReplicationMode } from "../types/ReplicationMode"
import { QueryResult } from "../../query-runner/QueryResult"
import { Table } from "../../schema-builder/table/Table"
import { TypeORMError } from "../../error"
import { ObjectLiteral } from "../../common/ObjectLiteral"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { ColumnType } from "../types/ColumnTypes"
import { MetadataTableType } from "../types/MetadataTableType"
import { OrmUtils } from "../../util/OrmUtils"
import { TableUnique } from "../../schema-builder/table/TableUnique"
import { TableCheck } from "../../schema-builder/table/TableCheck"
import { TableExclusion } from "../../schema-builder/table/TableExclusion"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { TableIndex } from "../../schema-builder/table/TableIndex"
import { TableIndexOptions } from "../../schema-builder/options/TableIndexOptions"

class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any

    constructor(driver: any, mode: ReplicationMode) {
        super(driver, mode)
    }
}

/**
 * Runs queries on a single postgres database connection.
 */
export class AuroraPostgresQueryRunner
    extends PostgresQueryRunnerWrapper
    implements QueryRunner
{
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: AuroraPostgresDriver

    protected client: any

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

    constructor(
        driver: AuroraPostgresDriver,
        client: any,
        mode: ReplicationMode,
    ) {
        super(driver, mode)

        this.client = client
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
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        } else {
            // master
            this.databaseConnectionPromise = this.driver
                .obtainMasterConnection()
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        }

        return this.databaseConnectionPromise
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
            await this.client.startTransaction()
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
            await this.client.commitTransaction()
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
            await this.client.rollbackTransaction()
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

        const raw = await this.client.query(query, parameters)

        const result = new QueryResult()

        result.raw = raw

        if (raw?.hasOwnProperty("records") && Array.isArray(raw.records)) {
            result.records = raw.records
        }

        if (raw?.hasOwnProperty("numberOfRecordsUpdated")) {
            result.affected = raw.numberOfRecordsUpdated
        }

        if (!useStructuredResult) {
            return result.raw
        }

        return result
    }

    /**
     * Change table comment.
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `aurora-postgres driver does not support change comment.`,
        )
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
            table_schema: string
            table_name: string
            table_comment: string
        }[] = []

        if (!tableNames) {
            const tablesSql = `SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables"`
            dbTables.push(...(await this.query(tablesSql)))
        } else {
            const tablesCondition = tableNames
                .map((tableName) => this.driver.parseTableName(tableName))
                .map(({ schema, tableName }) => {
                    return `("table_schema" = '${
                        schema || currentSchema
                    }' AND "table_name" = '${tableName}')`
                })
                .join(" OR ")

            const tablesSql =
                `SELECT "table_schema", "table_name", obj_description(('"' || "table_schema" || '"."' || "table_name" || '"')::regclass, 'pg_class') AS table_comment FROM "information_schema"."tables" WHERE ` +
                tablesCondition
            dbTables.push(...(await this.query(tablesSql)))
        }

        // if tables were not found in the db, no need to proceed
        if (dbTables.length === 0) {
            return []
        }

        /**
         * Uses standard SQL information_schema.columns table and postgres-specific
         * pg_catalog.pg_attribute table to get column information.
         * @see https://stackoverflow.com/a/19541865
         */
        const columnsCondition = dbTables
            .map(({ table_schema, table_name }) => {
                return `("table_schema" = '${table_schema}' AND "table_name" = '${table_name}')`
            })
            .join(" OR ")
        const columnsSql =
            `SELECT columns.*, pg_catalog.col_description(('"' || table_catalog || '"."' || table_schema || '"."' || table_name || '"')::regclass::oid, ordinal_position) AS description, ` +
            `('"' || "udt_schema" || '"."' || "udt_name" || '"')::text AS "regtype", pg_catalog.format_type("col_attr"."atttypid", "col_attr"."atttypmod") AS "format_type" ` +
            `FROM "information_schema"."columns" ` +
            `LEFT JOIN "pg_catalog"."pg_attribute" AS "col_attr" ON "col_attr"."attname" = "columns"."column_name" ` +
            `AND "col_attr"."attrelid" = ( ` +
            `SELECT "cls"."oid" FROM "pg_catalog"."pg_class" AS "cls" ` +
            `LEFT JOIN "pg_catalog"."pg_namespace" AS "ns" ON "ns"."oid" = "cls"."relnamespace" ` +
            `WHERE "cls"."relname" = "columns"."table_name" ` +
            `AND "ns"."nspname" = "columns"."table_schema" ` +
            `) ` +
            `WHERE ` +
            columnsCondition

        const constraintsCondition = dbTables
            .map(({ table_schema, table_name }) => {
                return `("ns"."nspname" = '${table_schema}' AND "t"."relname" = '${table_name}')`
            })
            .join(" OR ")

        const constraintsSql =
            `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", ` +
            `pg_get_constraintdef("cnst"."oid") AS "expression", ` +
            `CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUDE' END AS "constraint_type", "a"."attname" AS "column_name" ` +
            `FROM "pg_constraint" "cnst" ` +
            `INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" ` +
            `LEFT JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") ` +
            `WHERE "t"."relkind" IN ('r', 'p') AND (${constraintsCondition})`

        const indicesSql =
            `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", ` +
            `CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition", ` +
            `"types"."typname" AS "type_name", "am"."amname" AS "index_type" ` +
            `FROM "pg_class" "t" ` +
            `INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" ` +
            `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" ` +
            `INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" ` +
            `INNER JOIN "pg_type" "types" ON "types"."oid" = "a"."atttypid" ` +
            `INNER JOIN "pg_am" "am" ON "i"."relam" = "am"."oid" ` +
            `LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" ` +
            `WHERE "t"."relkind" IN ('r', 'p') AND "cnst"."contype" IS NULL AND (${constraintsCondition})`

        const foreignKeysCondition = dbTables
            .map(({ table_schema, table_name }) => {
                return `("ns"."nspname" = '${table_schema}' AND "cl"."relname" = '${table_name}')`
            })
            .join(" OR ")

        const hasRelispartitionColumn =
            await this.hasSupportForPartitionedTables()
        const isPartitionCondition = hasRelispartitionColumn
            ? ` AND "cl"."relispartition" = 'f'`
            : ""

        const foreignKeysSql =
            `SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", ` +
            `"ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", ` +
            `"con"."confupdtype" AS "on_update", "con"."condeferrable" AS "deferrable", "con"."condeferred" AS "deferred" ` +
            `FROM ( ` +
            `SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", ` +
            `"cl"."relname", "con1"."condeferrable", ` +
            `CASE WHEN "con1"."condeferred" THEN 'INITIALLY DEFERRED' ELSE 'INITIALLY IMMEDIATE' END as condeferred, ` +
            `CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", ` +
            `CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" ` +
            `FROM "pg_class" "cl" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_constraint" "con1" ON "con1"."conrelid" = "cl"."oid" ` +
            `WHERE "con1"."contype" = 'f' AND (${foreignKeysCondition}) ` +
            `) "con" ` +
            `INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" ` +
            `INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid" ${isPartitionCondition}` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"`

        const [
            dbColumns,
            dbConstraints,
            dbIndices,
            dbForeignKeys,
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
        ])

        // create tables for loaded tables
        return Promise.all(
            dbTables.map(async (dbTable) => {
                const table = new Table()

                const getSchemaFromKey = (dbObject: any, key: string) => {
                    return dbObject[key] === currentSchema &&
                    (!this.driver.options.schema ||
                        this.driver.options.schema === currentSchema)
                        ? undefined
                        : dbObject[key]
                }
                // We do not need to join schema name, when database is by default.
                const schema = getSchemaFromKey(dbTable, "table_schema")
                table.database = currentDatabase
                table.schema = dbTable["table_schema"]
                table.comment = dbTable["table_comment"]
                table.name = this.driver.buildTableName(
                    dbTable["table_name"],
                    schema,
                )

                // create columns from the loaded columns
                table.columns = await Promise.all(
                    dbColumns
                        .filter(
                            (dbColumn) =>
                                dbColumn["table_name"] ===
                                dbTable["table_name"] &&
                                dbColumn["table_schema"] ===
                                dbTable["table_schema"],
                        )
                        .map(async (dbColumn) => {
                            const columnConstraints = dbConstraints.filter(
                                (dbConstraint) => {
                                    return (
                                        dbConstraint["table_name"] ===
                                        dbColumn["table_name"] &&
                                        dbConstraint["table_schema"] ===
                                        dbColumn["table_schema"] &&
                                        dbConstraint["column_name"] ===
                                        dbColumn["column_name"]
                                    )
                                },
                            )

                            const tableColumn = new TableColumn()
                            tableColumn.name = dbColumn["column_name"]
                            tableColumn.type = dbColumn["regtype"].toLowerCase()

                            if (
                                tableColumn.type === "numeric" ||
                                tableColumn.type === "numeric[]" ||
                                tableColumn.type === "decimal" ||
                                tableColumn.type === "float"
                            ) {
                                let numericPrecision =
                                    dbColumn["numeric_precision"]
                                let numericScale = dbColumn["numeric_scale"]
                                if (dbColumn["data_type"] === "ARRAY") {
                                    const numericSize = dbColumn[
                                        "format_type"
                                        ].match(
                                        /^numeric\(([0-9]+),([0-9]+)\)\[\]$/,
                                    )
                                    if (numericSize) {
                                        numericPrecision = +numericSize[1]
                                        numericScale = +numericSize[2]
                                    }
                                }
                                // If one of these properties was set, and another was not, Postgres sets '0' in to unspecified property
                                // we set 'undefined' in to unspecified property to avoid changing column on sync
                                if (
                                    numericPrecision !== null &&
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        numericPrecision,
                                    )
                                ) {
                                    tableColumn.precision = numericPrecision
                                } else if (
                                    numericScale !== null &&
                                    !this.isDefaultColumnScale(
                                        table,
                                        tableColumn,
                                        numericScale,
                                    )
                                ) {
                                    tableColumn.precision = undefined
                                }
                                if (
                                    numericScale !== null &&
                                    !this.isDefaultColumnScale(
                                        table,
                                        tableColumn,
                                        numericScale,
                                    )
                                ) {
                                    tableColumn.scale = numericScale
                                } else if (
                                    numericPrecision !== null &&
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        numericPrecision,
                                    )
                                ) {
                                    tableColumn.scale = undefined
                                }
                            }

                            if (
                                tableColumn.type === "interval" ||
                                tableColumn.type === "time without time zone" ||
                                tableColumn.type === "time with time zone" ||
                                tableColumn.type ===
                                "timestamp without time zone" ||
                                tableColumn.type === "timestamp with time zone"
                            ) {
                                tableColumn.precision =
                                    !this.isDefaultColumnPrecision(
                                        table,
                                        tableColumn,
                                        dbColumn["datetime_precision"],
                                    )
                                        ? dbColumn["datetime_precision"]
                                        : undefined
                            }

                            // check if column has user-defined data type.
                            // NOTE: if ENUM type defined with "array:true" it comes with ARRAY type instead of USER-DEFINED
                            if (
                                dbColumn["data_type"] === "USER-DEFINED" ||
                                dbColumn["data_type"] === "ARRAY"
                            ) {
                                const { name } =
                                    await this.getUserDefinedTypeName(
                                        table,
                                        tableColumn,
                                    )

                                // check if `enumName` is specified by user
                                const builtEnumName = this.buildEnumName(
                                    table,
                                    tableColumn,
                                    false,
                                    true,
                                )
                                const enumName =
                                    builtEnumName !== name ? name : undefined

                                // check if type is ENUM
                                const sql =
                                    `SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" ` +
                                    `INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" ` +
                                    `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
                                    `WHERE "n"."nspname" = '${
                                        dbTable["table_schema"]
                                    }' AND "t"."typname" = '${
                                        enumName || name
                                    }'`
                                const results: ObjectLiteral[] =
                                    await this.query(sql)

                                if (results.length) {
                                    tableColumn.type = "enum"
                                    tableColumn.enum = results.map(
                                        (result) => result["value"],
                                    )
                                    tableColumn.enumName = enumName
                                }

                                if (dbColumn["data_type"] === "ARRAY") {
                                    tableColumn.isArray = true
                                    const type = tableColumn.type.replace(
                                        "[]",
                                        "",
                                    )
                                    tableColumn.type =
                                        this.connection.driver.normalizeType({
                                            type: type,
                                        })
                                }
                            }

                            if (
                                tableColumn.type === "geometry" ||
                                tableColumn.type === "geography"
                            ) {
                                const sql =
                                    `SELECT * FROM (` +
                                    `SELECT "f_table_schema" "table_schema", "f_table_name" "table_name", ` +
                                    `"f_${tableColumn.type}_column" "column_name", "srid", "type" ` +
                                    `FROM "${tableColumn.type}_columns"` +
                                    `) AS _ ` +
                                    `WHERE "column_name" = '${dbColumn["column_name"]}' AND ` +
                                    `"table_schema" = '${dbColumn["table_schema"]}' AND ` +
                                    `"table_name" = '${dbColumn["table_name"]}'`

                                const results: ObjectLiteral[] =
                                    await this.query(sql)

                                if (results.length > 0) {
                                    tableColumn.spatialFeatureType =
                                        results[0].type
                                    tableColumn.srid = results[0].srid
                                }
                            }

                            // check only columns that have length property
                            if (
                                this.driver.withLengthColumnTypes.indexOf(
                                    tableColumn.type as ColumnType,
                                ) !== -1
                            ) {
                                let length
                                if (tableColumn.isArray) {
                                    const match = /\((\d+)\)/.exec(
                                        dbColumn["format_type"],
                                    )
                                    length = match ? match[1] : undefined
                                } else if (
                                    dbColumn["character_maximum_length"]
                                ) {
                                    length =
                                        dbColumn[
                                            "character_maximum_length"
                                            ].toString()
                                }
                                if (length) {
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
                            tableColumn.isNullable =
                                dbColumn["is_nullable"] === "YES"

                            const primaryConstraint = columnConstraints.find(
                                (constraint) =>
                                    constraint["constraint_type"] === "PRIMARY",
                            )
                            if (primaryConstraint) {
                                tableColumn.isPrimary = true
                                // find another columns involved in primary key constraint
                                const anotherPrimaryConstraints =
                                    dbConstraints.filter(
                                        (constraint) =>
                                            constraint["table_name"] ===
                                            dbColumn["table_name"] &&
                                            constraint["table_schema"] ===
                                            dbColumn["table_schema"] &&
                                            constraint["column_name"] !==
                                            dbColumn["column_name"] &&
                                            constraint["constraint_type"] ===
                                            "PRIMARY",
                                    )

                                // collect all column names
                                const columnNames =
                                    anotherPrimaryConstraints.map(
                                        (constraint) =>
                                            constraint["column_name"],
                                    )
                                columnNames.push(dbColumn["column_name"])

                                // build default primary key constraint name
                                const pkName =
                                    this.connection.namingStrategy.primaryKeyName(
                                        table,
                                        columnNames,
                                    )

                                // if primary key has user-defined constraint name, write it in table column
                                if (
                                    primaryConstraint["constraint_name"] !==
                                    pkName
                                ) {
                                    tableColumn.primaryKeyConstraintName =
                                        primaryConstraint["constraint_name"]
                                }
                            }

                            const uniqueConstraints = columnConstraints.filter(
                                (constraint) =>
                                    constraint["constraint_type"] === "UNIQUE",
                            )
                            const isConstraintComposite =
                                uniqueConstraints.every((uniqueConstraint) => {
                                    return dbConstraints.some(
                                        (dbConstraint) =>
                                            dbConstraint["constraint_type"] ===
                                            "UNIQUE" &&
                                            dbConstraint["constraint_name"] ===
                                            uniqueConstraint[
                                                "constraint_name"
                                                ] &&
                                            dbConstraint["column_name"] !==
                                            dbColumn["column_name"],
                                    )
                                })
                            tableColumn.isUnique =
                                uniqueConstraints.length > 0 &&
                                !isConstraintComposite

                            if (dbColumn.is_identity === "YES") {
                                // Postgres 10+ Identity column
                                tableColumn.isGenerated = true
                                tableColumn.generationStrategy = "identity"
                                tableColumn.generatedIdentity =
                                    dbColumn.identity_generation
                            } else if (
                                dbColumn["column_default"] !== null &&
                                dbColumn["column_default"] !== undefined
                            ) {
                                const serialDefaultName = `nextval('${this.buildSequenceName(
                                    table,
                                    dbColumn["column_name"],
                                )}'::regclass)`
                                const serialDefaultPath = `nextval('${this.buildSequencePath(
                                    table,
                                    dbColumn["column_name"],
                                )}'::regclass)`

                                const defaultWithoutQuotes = dbColumn[
                                    "column_default"
                                    ].replace(/"/g, "")

                                if (
                                    defaultWithoutQuotes ===
                                    serialDefaultName ||
                                    defaultWithoutQuotes === serialDefaultPath
                                ) {
                                    tableColumn.isGenerated = true
                                    tableColumn.generationStrategy = "increment"
                                } else if (
                                    dbColumn["column_default"] ===
                                    "gen_random_uuid()" ||
                                    /^uuid_generate_v\d\(\)/.test(
                                        dbColumn["column_default"],
                                    )
                                ) {
                                    if (tableColumn.type === "uuid") {
                                        tableColumn.isGenerated = true
                                        tableColumn.generationStrategy = "uuid"
                                    } else {
                                        tableColumn.default =
                                            dbColumn["column_default"]
                                    }
                                } else if (
                                    dbColumn["column_default"] === "now()" ||
                                    dbColumn["column_default"].indexOf(
                                        "'now'::text",
                                    ) !== -1
                                ) {
                                    tableColumn.default =
                                        dbColumn["column_default"]
                                } else {
                                    tableColumn.default = dbColumn[
                                        "column_default"
                                        ].replace(/::[\w\s.[\]\-"]+/g, "")
                                    tableColumn.default =
                                        tableColumn.default.replace(
                                            /^(-?\d+)$/,
                                            "'$1'",
                                        )
                                }
                            }

                            if (
                                dbColumn["is_generated"] === "ALWAYS" &&
                                dbColumn["generation_expression"]
                            ) {
                                // In postgres there is no VIRTUAL generated column type
                                tableColumn.generatedType = "STORED"
                                // We cannot relay on information_schema.columns.generation_expression, because it is formatted different.
                                const asExpressionQuery =
                                    this.selectTypeormMetadataSql({
                                        database: currentDatabase,
                                        schema: dbTable["table_schema"],
                                        table: dbTable["table_name"],
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

                            tableColumn.comment = dbColumn["description"]
                                ? dbColumn["description"]
                                : undefined
                            if (dbColumn["character_set_name"])
                                tableColumn.charset =
                                    dbColumn["character_set_name"]
                            if (dbColumn["collation_name"])
                                tableColumn.collation =
                                    dbColumn["collation_name"]
                            return tableColumn
                        }),
                )

                // find unique constraints of table, group them by constraint name and build TableUnique.
                const tableUniqueConstraints = OrmUtils.uniq(
                    dbConstraints.filter((dbConstraint) => {
                        return (
                            dbConstraint["table_name"] ===
                            dbTable["table_name"] &&
                            dbConstraint["table_schema"] ===
                            dbTable["table_schema"] &&
                            dbConstraint["constraint_type"] === "UNIQUE"
                        )
                    }),
                    (dbConstraint) => dbConstraint["constraint_name"],
                )

                table.uniques = tableUniqueConstraints.map((constraint) => {
                    const uniques = dbConstraints.filter(
                        (dbC) =>
                            dbC["constraint_name"] ===
                            constraint["constraint_name"],
                    )
                    return new TableUnique({
                        name: constraint["constraint_name"],
                        columnNames: uniques.map((u) => u["column_name"]),
                        deferrable: constraint["deferrable"]
                            ? constraint["deferred"]
                            : undefined,
                    })
                })

                // find check constraints of table, group them by constraint name and build TableCheck.
                const tableCheckConstraints = OrmUtils.uniq(
                    dbConstraints.filter((dbConstraint) => {
                        return (
                            dbConstraint["table_name"] ===
                            dbTable["table_name"] &&
                            dbConstraint["table_schema"] ===
                            dbTable["table_schema"] &&
                            dbConstraint["constraint_type"] === "CHECK"
                        )
                    }),
                    (dbConstraint) => dbConstraint["constraint_name"],
                )

                table.checks = tableCheckConstraints.map((constraint) => {
                    const checks = dbConstraints.filter(
                        (dbC) =>
                            dbC["constraint_name"] ===
                            constraint["constraint_name"],
                    )
                    return new TableCheck({
                        name: constraint["constraint_name"],
                        columnNames: checks.map((c) => c["column_name"]),
                        expression: constraint["expression"].replace(
                            /^\s*CHECK\s*\((.*)\)\s*$/i,
                            "$1",
                        ),
                    })
                })

                // find exclusion constraints of table, group them by constraint name and build TableExclusion.
                const tableExclusionConstraints = OrmUtils.uniq(
                    dbConstraints.filter((dbConstraint) => {
                        return (
                            dbConstraint["table_name"] ===
                            dbTable["table_name"] &&
                            dbConstraint["table_schema"] ===
                            dbTable["table_schema"] &&
                            dbConstraint["constraint_type"] === "EXCLUDE"
                        )
                    }),
                    (dbConstraint) => dbConstraint["constraint_name"],
                )

                table.exclusions = tableExclusionConstraints.map(
                    (constraint) => {
                        return new TableExclusion({
                            name: constraint["constraint_name"],
                            expression: constraint["expression"].substring(8), // trim EXCLUDE from start of expression
                        })
                    },
                )

                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils.uniq(
                    dbForeignKeys.filter((dbForeignKey) => {
                        return (
                            dbForeignKey["table_name"] ===
                            dbTable["table_name"] &&
                            dbForeignKey["table_schema"] ===
                            dbTable["table_schema"]
                        )
                    }),
                    (dbForeignKey) => dbForeignKey["constraint_name"],
                )

                table.foreignKeys = tableForeignKeyConstraints.map(
                    (dbForeignKey) => {
                        const foreignKeys = dbForeignKeys.filter(
                            (dbFk) =>
                                dbFk["constraint_name"] ===
                                dbForeignKey["constraint_name"],
                        )

                        // if referenced table located in currently used schema, we don't need to concat schema name to table name.
                        const schema = getSchemaFromKey(
                            dbForeignKey,
                            "referenced_table_schema",
                        )
                        const referencedTableName = this.driver.buildTableName(
                            dbForeignKey["referenced_table_name"],
                            schema,
                        )

                        return new TableForeignKey({
                            name: dbForeignKey["constraint_name"],
                            columnNames: foreignKeys.map(
                                (dbFk) => dbFk["column_name"],
                            ),
                            referencedSchema:
                                dbForeignKey["referenced_table_schema"],
                            referencedTableName: referencedTableName,
                            referencedColumnNames: foreignKeys.map(
                                (dbFk) => dbFk["referenced_column_name"],
                            ),
                            onDelete: dbForeignKey["on_delete"],
                            onUpdate: dbForeignKey["on_update"],
                            deferrable: dbForeignKey["deferrable"]
                                ? dbForeignKey["deferred"]
                                : undefined,
                        })
                    },
                )

                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils.uniq(
                    dbIndices.filter((dbIndex) => {
                        return (
                            dbIndex["table_name"] === dbTable["table_name"] &&
                            dbIndex["table_schema"] === dbTable["table_schema"]
                        )
                    }),
                    (dbIndex) => dbIndex["constraint_name"],
                )

                table.indices = tableIndexConstraints.map((constraint) => {
                    const indices = dbIndices.filter((index) => {
                        return (
                            index["table_schema"] ===
                            constraint["table_schema"] &&
                            index["table_name"] === constraint["table_name"] &&
                            index["constraint_name"] ===
                            constraint["constraint_name"]
                        )
                    })
                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: constraint["constraint_name"],
                        columnNames: indices.map((i) => i["column_name"]),
                        isUnique: constraint["is_unique"] === "TRUE",
                        where: constraint["condition"],
                        isSpatial: constraint["index_type"] === "gist",
                        isFulltext: false,
                    })
                })

                return table
            }),
        )
    }

}
