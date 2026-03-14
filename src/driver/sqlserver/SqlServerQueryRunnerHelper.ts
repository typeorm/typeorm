import { Query } from "../Query"
import type { Table } from "../../schema-builder/table/Table"
import type { TableColumn } from "../../schema-builder/table/TableColumn"
import type { SqlServerDriver } from "./SqlServerDriver"

// Helper for the "length-only fast path (Spanner)" logic
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

interface ColumnLengthChangeParams {
    oldColumn: TableColumn
    newColumn: TableColumn
    table: Table
    driver: SqlServerDriver
    upQueries: Query[]
    escapePath: (table: Table | string) => string
}

/**
 *
 * @param root0
 * @param root0.oldColumn
 * @param root0.newColumn
 * @param root0.table
 * @param root0.driver
 * @param root0.upQueries
 * @param root0.escapePath
 */
export function handleColumnLengthChange({
    oldColumn,
    newColumn,
    table,
    driver,
    upQueries,
    escapePath,
}: ColumnLengthChangeParams): void {
    const oldLen =
        typeof oldColumn.length === "string"
            ? parseInt(oldColumn.length, 10)
            : undefined
    const newLen =
        typeof newColumn.length === "string"
            ? parseInt(newColumn.length, 10)
            : undefined
    const isOldMax =
        typeof oldColumn.length === "string" &&
        oldColumn.length.toUpperCase() === "MAX"
    const isNewMax =
        typeof newColumn.length === "string" &&
        newColumn.length.toUpperCase() === "MAX"

    if (
        !isNewMax &&
        typeof newLen === "number" &&
        ((typeof oldLen === "number" && newLen < oldLen) || isOldMax)
    ) {
        const col = driver.escape(oldColumn.name)
        const t = (newColumn.type as string).toLowerCase()
        const threshold = t.startsWith("n") ? `${newLen}*2` : `${newLen}`
        const isBinary = t === "varbinary" || t === "binary"
        const updateExpr = isBinary
            ? `SUBSTRING(${col}, 1, ${newLen})`
            : `LEFT(${col}, ${newLen})`

        upQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET ${col} = ${updateExpr} WHERE DATALENGTH(${col}) > ${threshold}`,
            ),
        )
    }

    const t = (newColumn.type as string).toLowerCase()
    const isCharOrBin =
        t === "varchar" ||
        t === "nvarchar" ||
        t === "varbinary" ||
        t === "char" ||
        t === "nchar" ||
        t === "binary"

    if (isCharOrBin) {
        const fullTypeSql = driver.createFullType(newColumn)
        const collationSql = newColumn.collation
            ? ` COLLATE ${newColumn.collation}`
            : ""
        const nullSql = newColumn.isNullable ? " NULL" : " NOT NULL"

        const tableName = escapePath(table)
        const colName = driver.escape(newColumn.name)

        upQueries.push(
            new Query(
                `ALTER TABLE ${tableName} ALTER COLUMN ${colName} ${fullTypeSql}${collationSql}${nullSql}`,
            ),
        )

        const cached = table.findColumnByName(newColumn.name)
        if (cached) cached.length = newColumn.length
    }
}

export type SqlServerSafeAlterArgs = {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn

    // infra / helpers from the runner
    upQueries: Query[]
    downQueries: Query[]
    Query: typeof Query
    escapePath: (target: string | Table) => string
    executeQueries: (up: Query[], down: Query[]) => Promise<void>
    replaceCachedTable: (table: Table, cloned: Table) => void

    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean

    // must return a SQL Server ALTER-COLUMN fragment INCLUDING NULL/NOT NULL, e.g.:
    //   NVARCHAR(200) NULL
    //   DECIMAL(12,2) NOT NULL
    buildAlterColumnDefinition: (column: TableColumn) => string

    // returns the default constraint name for a column (e.g. from naming strategy)
    defaultConstraintName: (table: Table, columnName: string) => string

    // optional custom identifier quoting (defaults to [brackets])
    quoteIdent?: (ident: string) => string
}

/**
 *
 * @param root0
 * @param root0.table
 * @param root0.clonedTable
 * @param root0.oldColumn
 * @param root0.newColumn
 * @param root0.upQueries
 * @param root0.downQueries
 * @param root0.Query
 * @param root0.escapePath
 * @param root0.executeQueries
 * @param root0.replaceCachedTable
 * @param root0.isSafeAlter
 * @param root0.buildAlterColumnDefinition
 * @param root0.defaultConstraintName
 * @param root0.quoteIdent
 */
export async function handleSafeAlterSqlServer({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query: QueryCtor,
    escapePath,
    executeQueries,
    replaceCachedTable,
    isSafeAlter,
    buildAlterColumnDefinition,
    defaultConstraintName,
    quoteIdent = (i) => `[${i.replace(/]/g, "]]")}]`,
}: SqlServerSafeAlterArgs): Promise<boolean> {
    // Skip computed/identity columns (cannot freely ALTER type)
    if (oldColumn.asExpression || newColumn.asExpression) return false
    if (oldColumn.generatedIdentity || newColumn.generatedIdentity) return false

    // Only proceed when caller says this change is safely widening
    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)

    // SQL Server does not allow ALTER COLUMN when the column has a DEFAULT constraint.
    // We must drop it before altering and re-add it afterwards.
    const hasDefault =
        oldColumn.default !== null && oldColumn.default !== undefined
    if (hasDefault) {
        const defName = defaultConstraintName(table, colName)
        upQueries.push(
            new QueryCtor(
                `ALTER TABLE ${tableSql} DROP CONSTRAINT "${defName}"`,
            ),
        )
        downQueries.push(
            new QueryCtor(
                `ALTER TABLE ${tableSql} ADD CONSTRAINT "${defName}" DEFAULT ${oldColumn.default} FOR ${quoteIdent(colName)}`,
            ),
        )
    }

    // Build ALTER-COLUMN definitions (must include NULL/NOT NULL; do NOT include DEFAULT in SQL Server)
    const newDef = buildAlterColumnDefinition(newColumn)
    const oldDef = buildAlterColumnDefinition(oldColumn)

    const upSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${quoteIdent(
        colName,
    )} ${newDef}`
    const downSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${quoteIdent(
        colName,
    )} ${oldDef}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    // Re-add the default constraint after the ALTER COLUMN
    if (hasDefault) {
        const defName = defaultConstraintName(table, colName)
        upQueries.push(
            new QueryCtor(
                `ALTER TABLE ${tableSql} ADD CONSTRAINT "${defName}" DEFAULT ${oldColumn.default} FOR ${quoteIdent(colName)}`,
            ),
        )
        downQueries.push(
            new QueryCtor(
                `ALTER TABLE ${tableSql} DROP CONSTRAINT "${defName}"`,
            ),
        )
    }

    return true
}
