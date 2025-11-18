import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (Oracle)" logic.
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

export type OracleLengthOnlyFastPathArgs = {
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
 * Apply Oracle length-only alter logic, pushing appropriate up/down queries.
 *
 * Does not alter nullability in the DDL to avoid ORA-01442 when combined with other statements.
 */
export function handleOracleLengthOnlyFastPath({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    driver,
    escapePath,
    Query,
}: OracleLengthOnlyFastPathArgs): boolean {
    const oldLen = oldColumn.length
        ? parseInt(String(oldColumn.length), 10)
        : undefined
    const newLen = newColumn.length
        ? parseInt(String(newColumn.length), 10)
        : undefined
    const col: string = String(oldColumn.name)

    if (oldLen && newLen && newLen < oldLen) {
        // shrink: avoid ORA-01441 by truncating first
        upQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET "${col}" = SUBSTR("${col}", 1, ${newLen}) WHERE LENGTH("${col}") > ${newLen}`,
            ),
        )
    }

    // IMPORTANT: since nullability didn't change, don't mention it here.
    // This prevents ORA-01442 when combined with other generated statements.
    upQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(
                table,
            )} MODIFY ("${col}" ${driver.createFullType(newColumn)})`,
        ),
    )

    downQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(
                table,
            )} MODIFY ("${col}" ${driver.createFullType(oldColumn)})`,
        ),
    )

    // Keep in-memory cloned metadata in sync to avoid later re-diffs.
    const clonedCol = clonedTable?.columns?.find?.((c: any) => c.name === col)
    if (clonedCol) clonedCol.length = newColumn.length

    return true
}

export type OracleSafeAlterArgs = {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn

    // infra / helpers from the runner
    upQueries: Query[]
    downQueries: Query[]
    Query: typeof Query
    escapePath: (target: string | Table) => string

    // must return the FULL Oracle column definition (type + nullability + default + etc.)
    // Typically you'll pass: (col) => this.buildCreateColumnSql(col)
    buildCreateColumnSql: (column: TableColumn) => string

    executeQueries: (up: Query[], down: Query[]) => Promise<void>
    replaceCachedTable: (table: Table, cloned: Table) => void

    // your guard
    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean
}

export async function handleSafeAlterOracle({
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
}: OracleSafeAlterArgs): Promise<boolean> {
    // Skip generated/computed/identity columns (Oracle won't freely MODIFY these)
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
    // Oracle TIMESTAMP precision must be between 0 and 9. Clamp to avoid ORA-30088.
    const clampTs = (col: any) => {
        const t = String(col.type ?? "").toLowerCase()
        if (t === "timestamp" || t.startsWith("timestamp")) {
            const p = col.precision
            if (p == null) col.precision = 6
            else col.precision = Math.max(0, Math.min(9, Number(p)))
        }
    }
    clampTs(newColumn)
    clampTs(oldColumn)

    // Build full definitions
    const newDef = buildCreateColumnSql(newColumn)
    const oldDef = buildCreateColumnSql(oldColumn)

    // Strip the leading `"colname" ` so we can inject the identifier only once
    const stripLeadingName = (def: string) => def.replace(/^"[^"]+"\s+/, "")

    const newDefSansName = stripLeadingName(newDef)
    const oldDefSansName = stripLeadingName(oldDef)

    // When nullability hasn't changed, avoid specifying NULL/NOT NULL in MODIFY.
    // This prevents ORA-01442 ("column to be modified to NOT NULL is already NOT NULL")
    // for safe widening changes.
    let finalNewDef = newDefSansName
    let finalOldDef = oldDefSansName

    if (oldColumn.isNullable === newColumn.isNullable) {
        const stripNullability = (def: string) =>
            def.replace(/\s+NOT NULL\b/gi, "").replace(/\s+NULL\b/gi, "")
        finalNewDef = stripNullability(finalNewDef)
        finalOldDef = stripNullability(finalOldDef)
    }

    // Correct: name only once
    const upSql = `ALTER TABLE ${tableSql} MODIFY (${q(
        colName,
    )} ${finalNewDef})`
    const downSql = `ALTER TABLE ${tableSql} MODIFY (${q(
        colName,
    )} ${finalOldDef})`

    console.log("[safe-alter up]", upSql)
    console.log("[safe-alter down]", downSql)

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))
    return true
}

export default handleOracleLengthOnlyFastPath
