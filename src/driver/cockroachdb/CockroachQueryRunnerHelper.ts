import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (Cockroach) — FIXED" logic.
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)
// column is modified.

export type CrdbLengthOnlyFastPathArgs = {
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
 * Apply CockroachDB length-only alter logic, pushing appropriate up/down queries.
 *
 * It updates the clonedTable column length to keep in-memory state in sync and
 * returns true when it handled the alteration so the caller can short-circuit.
 */
export function handleCockroachLengthOnlyFastPath({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    driver,
    escapePath,
    Query,
}: CrdbLengthOnlyFastPathArgs): boolean {
    const parseLen = (v?: string | number | null) =>
        v != null && String(v).trim() !== ""
            ? Number.parseInt(String(v), 10)
            : undefined

    const oldLen = parseLen(oldColumn.length as any)
    const newLen = parseLen(newColumn.length as any)

    // Length change never implies a rename; guard identifier
    const colName: string = (newColumn?.name ?? oldColumn?.name) as string
    const qCol = `"${colName}"`

    const isStringType =
        /^(varchar|character varying|text|char|character)$/i.test(
            String(newColumn?.type ?? ""),
        )

    const typeNew = driver.createFullType(newColumn)
    const typeOld = driver.createFullType(oldColumn)

    // Are we shrinking? (new length is defined and < old, or old was unspecified)
    const shrinking =
        isStringType &&
        newLen !== undefined &&
        (oldLen === undefined || newLen < oldLen)

    if (isStringType && shrinking) {
        // --- UP (shrink): Cockroach requires USING with substring to ensure safe cast
        // newLen is defined in this branch
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} SET DATA TYPE ${typeNew} USING substring(${qCol} FROM 1 FOR ${newLen})`,
            ),
        )

        // --- DOWN (revert): only add USING if oldLen existed; otherwise no USING
        const usingOld =
            oldLen !== undefined
                ? ` USING substring(${qCol} FROM 1 FOR ${oldLen})`
                : ""
        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} SET DATA TYPE ${typeOld}${usingOld}`,
            ),
        )
    } else {
        // Widening or non-string types: plain SET DATA TYPE both directions
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(
                    table,
                )} ALTER COLUMN ${qCol} SET DATA TYPE ${typeNew}`,
            ),
        )

        // For DOWN, if going back to a **shorter** varchar and oldLen is known,
        // mirror WITH USING to guarantee safe cast; else plain SET DATA TYPE.
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
                )} ALTER COLUMN ${qCol} SET DATA TYPE ${typeOld}${usingOld}`,
            ),
        )
    }

    // Update cloned metadata and STOP falling through
    const clonedCol = clonedTable?.columns?.find?.(
        (c: any) => c.name === colName,
    )
    if (clonedCol) clonedCol.length = newColumn.length

    return true
}

export type CockroachSafeAlterArgs = {
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

    // must return a TYPE fragment like: "varchar(200)", "numeric(12,2)", "timestamp"
    buildColumnType: (column: TableColumn) => string
}

export async function handleSafeAlterCockroach({
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
}: CockroachSafeAlterArgs): Promise<boolean> {
    // Skip generated/computed columns or identity columns
    if ((oldColumn as any).asExpression || (newColumn as any).asExpression)
        return false
    if (
        (oldColumn as any).generatedIdentity ||
        (newColumn as any).generatedIdentity
    )
        return false

    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)
    const q = (i: string) => `"${i.replace(/"/g, '""')}"`

    const newType = buildColumnType(newColumn)
    const oldType = buildColumnType(oldColumn)

    const upSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${q(
        colName,
    )} SET DATA TYPE ${newType}`
    const downSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${q(
        colName,
    )} SET DATA TYPE ${oldType}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    return true
}

export default handleCockroachLengthOnlyFastPath
