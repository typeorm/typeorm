import type { Query } from "../Query"
import type { Table } from "../../schema-builder/table/Table"
import type { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (Spanner)" logic
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

export interface SpannerFastPathArgs {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn
    upQueries: Query[]
    downQueries: Query[]

    Query: new (query: string, parameters?: unknown[]) => Query

    escapePath: (table: Table) => string

    driver: { escape: (name: string) => string }

    executeQueries: (u: Query[], d: Query[]) => Promise<void>
}

/**
 *
 * @param args
 */
export async function handleSpannerLengthOnlyFastPath(
    args: SpannerFastPathArgs,
): Promise<boolean> {
    const {
        table,
        oldColumn,
        newColumn,
        upQueries,
        downQueries,
        Query,
        escapePath,
        driver,
    } = args

    const oldLen = oldColumn.length
        ? parseInt(String(oldColumn.length), 10)
        : undefined
    const newLen = newColumn.length
        ? parseInt(String(newColumn.length), 10)
        : undefined
    const col = oldColumn.name

    if (oldLen && newLen && newLen < oldLen) {
        upQueries.push(
            new Query(
                `UPDATE ${escapePath(table)} SET ${driver.escape(
                    col,
                )} = SUBSTR(${driver.escape(
                    col,
                )}, 1, ${newLen}) WHERE LENGTH(${driver.escape(
                    col,
                )}) > ${newLen}`,
            ),
        )
    }

    upQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(table)} ALTER COLUMN ${driver.escape(
                col,
            )} STRING(${newLen ?? oldLen})`,
        ),
    )
    downQueries.push(
        new Query(
            `ALTER TABLE ${escapePath(table)} ALTER COLUMN ${driver.escape(
                col,
            )} STRING(${oldLen ?? newLen})`,
        ),
    )

    return true
}

export type SpannerSafeAlterArgs = {
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

    // must return a Spanner TYPE fragment like: "STRING(1024)", "STRING(MAX)", "BYTES(16)", "TIMESTAMP", "NUMERIC"
    buildColumnType: (column: TableColumn) => string

    // optional custom identifier quoting (defaults to backticks)
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
 * @param root0.buildColumnType
 * @param root0.quoteIdent
 */
export async function handleSafeAlterSpanner({
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
    quoteIdent = (i) => `\`${i.replace(/`/g, "``")}\``,
}: SpannerSafeAlterArgs): Promise<boolean> {
    // Skip generated/computed/identity columns (cannot freely change)
    if (oldColumn.asExpression || newColumn.asExpression) return false
    if (oldColumn.generatedIdentity || newColumn.generatedIdentity) return false

    // Only proceed when caller says this change is safely widening
    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)

    // TYPE-only fragments (nullability/default unchanged)
    const newType = buildColumnType(newColumn)
    const oldType = buildColumnType(oldColumn)

    // Spanner GoogleSQL syntax
    const upSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${quoteIdent(
        colName,
    )} SET DATA TYPE ${newType}`
    const downSql = `ALTER TABLE ${tableSql} ALTER COLUMN ${quoteIdent(
        colName,
    )} SET DATA TYPE ${oldType}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    return true
}

export default handleSpannerLengthOnlyFastPath
