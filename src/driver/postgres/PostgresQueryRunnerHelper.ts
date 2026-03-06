import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (Postgres)" logic
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

export type PgLengthOnlyFastPathArgs = {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn
    upQueries: Query[]
    downQueries: Query[]

    driver: {
        createFullType: (col: TableColumn) => string
        escape?: (name: string) => string
    }

    escapePath: (table: string | Table) => string

    Query: new (query: string, parameters?: unknown[]) => Query
}

/**
 * Apply Postgres length-only alter logic, pushing appropriate up/down queries.
 *
 * It updates the clonedTable column length to keep in-memory state in sync and
 * returns true when it handled the alteration so the caller can short-circuit.
 * @param root0
 * @param root0.table
 * @param root0.clonedTable
 * @param root0.oldColumn
 * @param root0.newColumn
 * @param root0.upQueries
 * @param root0.downQueries
 * @param root0.driver
 * @param root0.escapePath
 * @param root0.Query
 */
export function handlePostgresLengthOnlyFastPath({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    driver,
    escapePath,
    Query,
}: PgLengthOnlyFastPathArgs): boolean {
    const oldLen =
        oldColumn.length != null
            ? parseInt(String(oldColumn.length), 10)
            : undefined
    const newLen =
        newColumn.length != null
            ? parseInt(String(newColumn.length), 10)
            : undefined

    // Length change never implies rename; guard identifier
    const colName: string = (newColumn?.name ?? oldColumn?.name) as string
    const qCol = `"${colName.replace(/"/g, '""')}"`

    const isStringType =
        /^(varchar|character varying|text|char|character)$/i.test(
            String(newColumn?.type ?? ""),
        )

    const typeNew = driver.createFullType(newColumn)
    const typeOld = driver.createFullType(oldColumn)

    // Are we shrinking? (newLen is defined and < old, or old was unspecified)
    const shrinking =
        isStringType &&
        newLen !== undefined &&
        (oldLen === undefined || newLen < oldLen)

    if (isStringType && shrinking) {
        // --- UP: shrink with USING + substring to avoid errors
        // newLen is defined here
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} TYPE ${typeNew} USING substring(${qCol} FROM 1 FOR ${newLen})`,
            ),
        )

        // --- DOWN: revert; ONLY add USING if oldLen exists
        const usingOld =
            oldLen !== undefined
                ? ` USING substring(${qCol} FROM 1 FOR ${oldLen})`
                : ""
        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} TYPE ${typeOld}${usingOld}`,
            ),
        )
    } else {
        // Widening or non-string types: plain TYPE both directions
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} TYPE ${typeNew}`,
            ),
        )

        // For DOWN, if returning to a shorter varchar and oldLen is known, use USING; else plain TYPE
        const needsUsingOld =
            isStringType &&
            oldLen !== undefined &&
            (newLen === undefined || oldLen < newLen)
        const usingOld = needsUsingOld
            ? ` USING substring(${qCol} FROM 1 FOR ${oldLen})`
            : ""

        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} TYPE ${typeOld}${usingOld}`,
            ),
        )
    }

    // Update cloned metadata and stop fallthrough
    const clonedCol = clonedTable?.columns?.find?.(
        (c: tableColumn) => c.name === colName,
    )
    if (clonedCol) clonedCol.length = newColumn.length

    return true
}

export type PostgresSafeAlterArgs = {
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

    // your guard
    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean

    // must return a Postgres TYPE fragment like: "varchar(200)", "numeric(12,2)", "timestamp without time zone"
    buildColumnType: (column: TableColumn) => string
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
 * @param root0.buildColumnType
 */
export async function handleSafeAlterPostgres({
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
    buildColumnType,
}: PostgresSafeAlterArgs): Promise<boolean> {
    // Skip generated/computed/identity/serial-like columns (cannot freely change type without extra steps)
    if (oldColumn.asExpression || newColumn.asExpression) return false
    if (oldColumn.generatedIdentity || newColumn.generatedIdentity) return false

    // Only proceed when caller says this change is safely widening
    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)
    const q = (i: string) => `"${i.replace(/"/g, '""')}"`

    // Build TYPE-only fragments (no NULL/DEFAULT/etc.)
    const newType = buildColumnType(newColumn)
    const oldType = buildColumnType(oldColumn)

    // Postgres widening: no USING clause needed
    const upSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${q(
        colName,
    )} TYPE ${newType}`
    const downSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${q(
        colName,
    )} TYPE ${oldType}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    // best-effort cache sync
    const cloned = clonedTable?.findColumnByName?.(colName)
    if (cloned) {
        cloned.type = newColumn.type
        cloned.length = newColumn.length ?? ""
        cloned.precision = newColumn.precision
        cloned.scale = newColumn.scale
    }
    replaceCachedTable(table, clonedTable)

    return true
}

// Convenience default export
export default handlePostgresLengthOnlyFastPath
