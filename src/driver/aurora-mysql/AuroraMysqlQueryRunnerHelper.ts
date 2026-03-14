import type { Query } from "../Query"
import type { Table } from "../../schema-builder/table/Table"
import type { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (MySQL family)" logic.
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)
// column is modified.

export type MysqlLengthOnlyFastPathArgs = {
    table: Table // TypeORM Table
    clonedTable: Table // TypeORM Table
    oldColumn: TableColumn // TypeORM TableColumn
    newColumn: TableColumn // TypeORM TableColumn
    upQueries: Query[] // Array<Query>
    downQueries: Query[] // Array<Query>
    Query: new (query: string, parameters?: unknown[]) => Query
    // Methods from the runner/driver
    escapePath: (table: string | Table) => string
    isColumnChanged: (
        oldCol: TableColumn,
        newCol: TableColumn,
        compareDefault?: boolean,
    ) => boolean
    buildCreateColumnSql: (
        col: TableColumn,
        skipIdentity: boolean,
        skipPrimary: boolean,
    ) => string
    executeQueries: (upQ: Query[], downQ: Query[]) => Promise<void>
    replaceCachedTable: (table: Table, cloned: Table) => void
}

/**
 * Apply MySQL-family length-only alter logic. Returns true if handled.
 *
 * Notes:
 * - Skips BIT columns (string funcs not safe) and generated columns.
 * - Pre-truncates on shrink to avoid errors, then issues MODIFY with a full column definition
 *   to preserve attributes (collation, nullability, default, etc.).
 * @param root0
 * @param root0.table
 * @param root0.clonedTable
 * @param root0.oldColumn
 * @param root0.newColumn
 * @param root0.upQueries
 * @param root0.downQueries
 * @param root0.Query
 * @param root0.escapePath
 * @param root0.isColumnChanged
 * @param root0.buildCreateColumnSql
 * @param root0.executeQueries
 * @param root0.replaceCachedTable
 */
export async function handleMysqlLengthOnlyFastPath({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query,
    escapePath,
    isColumnChanged,
    buildCreateColumnSql,
    executeQueries,
    replaceCachedTable,
}: MysqlLengthOnlyFastPathArgs): Promise<boolean> {
    // Only use this path when no other column attributes changed.
    const newColumnExceptLength: TableColumn = newColumn?.clone
        ? newColumn.clone()
        : Object.assign(
              Object.create(Object.getPrototypeOf(newColumn)),
              newColumn,
          )
    newColumnExceptLength.length = oldColumn.length

    if (isColumnChanged(oldColumn, newColumnExceptLength, true)) {
        // Other changes present; fall through to generic change flow.
        return false
    }

    const col: string = String(oldColumn.name)

    const type = String(oldColumn.type || "").toLowerCase()
    if (type === "bit") {
        // Not safe to truncate/modify BIT via string funcs; fall through to generic flow.
        return false
    }

    const isGenerated = Boolean(
        newColumn.asExpression || oldColumn.asExpression,
    )

    // Generated/computed columns are handled by the generic change flow.
    if (isGenerated) {
        return false
    }

    const oldLenRaw =
        oldColumn.length != null ? parseInt(String(oldColumn.length), 10) : NaN
    const newLenRaw =
        newColumn.length != null ? parseInt(String(newColumn.length), 10) : NaN

    const haveFiniteLengths =
        Number.isFinite(oldLenRaw) && Number.isFinite(newLenRaw)

    if (haveFiniteLengths && newLenRaw < oldLenRaw) {
        const newLen = newLenRaw
        // shrink: pre-truncate rows that exceed new length
        upQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET \`${col}\` = LEFT(\`${col}\`, ${newLen}) WHERE CHAR_LENGTH(\`${col}\`) > ${newLen}`,
            ),
        )
        // (optional) down: if reverting to larger oldLen, no data change needed
    }

    // In-place alter; include full column definition to preserve all attributes
    upQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(
                table,
            )} MODIFY \`${col}\` ${buildCreateColumnSql(
                newColumn,
                true,
                true,
            )}`,
        ),
    )
    downQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(
                table,
            )} MODIFY \`${col}\` ${buildCreateColumnSql(
                oldColumn,
                true,
                true,
            )}`,
        ),
    )

    return true
}

export type MysqlSafeAlterArgs = {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn

    // infra / helpers from the runner
    upQueries: Query[]
    downQueries: Query[]
    Query: typeof Query
    escapePath: (target: string | Table) => string
    buildCreateColumnSql: (
        column: TableColumn,
        skipDefault?: boolean,
        skipOnUpdate?: boolean,
    ) => string
    executeQueries: (up: Query[], down: Query[]) => Promise<void>
    replaceCachedTable: (table: Table, cloned: Table) => void

    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean
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
 * @param root0.buildCreateColumnSql
 * @param root0.executeQueries
 * @param root0.replaceCachedTable
 * @param root0.isSafeAlter
 */
export async function handleSafeAlter({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query: QueryCtor,
    escapePath,
    buildCreateColumnSql,
    executeQueries,
    replaceCachedTable,
    isSafeAlter,
}: MysqlSafeAlterArgs): Promise<boolean> {
    // do not touch generated/computed columns
    if (oldColumn.asExpression || newColumn.asExpression) return false

    // only proceed if caller’s rule says the change is safe
    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)
    const quoteIdent = (i: string) => `\`${i}\``

    // Build FULL MySQL definition strings to preserve attributes (nullability, default, collation, etc.)
    const newDef = buildCreateColumnSql(
        newColumn,
        /*skipDefault*/ true,
        /*skipOnUpdate*/ true,
    )
    const oldDef = buildCreateColumnSql(
        oldColumn,
        /*skipDefault*/ true,
        /*skipOnUpdate*/ true,
    )

    // Aurora MySQL prefers MODIFY COLUMN for type/width/precision changes
    const upSql = `ALTER TABLE ${tableSql} MODIFY COLUMN ${quoteIdent(
        colName,
    )} ${newDef}`
    const downSql = `ALTER TABLE ${tableSql} MODIFY COLUMN ${quoteIdent(
        colName,
    )} ${oldDef}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    return true
}

export default handleMysqlLengthOnlyFastPath
