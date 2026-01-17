import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (Postgres)" logic
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

export type PgLengthOnlyFastPathArgs = {
    table: Table // TypeORM Table
    clonedTable: Table // TypeORM Table
    oldColumn: TableColumn // TypeORM TableColumn
    newColumn: TableColumn // TypeORM TableColumn
    upQueries: Query[] // Array<Query>
    downQueries: Query[] // Array<Query>
    driver: { createFullType: (col: any) => string } & {
        escape?: (name: string) => string
    }
    escapePath: (table: any) => string
    Query: new (query: string, parameters?: any[]) => any
}

/**
 * Apply Postgres length-only alter logic, pushing appropriate up/down queries.
 *
 * It updates the clonedTable column length to keep in-memory state in sync and
 * returns true when it handled the alteration so the caller can short-circuit.
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
        (c: any) => c.name === colName,
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
    if ((oldColumn as any).asExpression || (newColumn as any).asExpression)
        return false
    if (
        (oldColumn as any).generatedIdentity ||
        (newColumn as any).generatedIdentity
    )
        return false

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
        ;(cloned as any).precision = (newColumn as any).precision
        ;(cloned as any).scale = (newColumn as any).scale
    }
    replaceCachedTable(table, clonedTable)

    return true
}

// Convenience default export
export default handlePostgresLengthOnlyFastPath
