import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (MySQL family)" logic that uses CHANGE COLUMN.
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)
// column is modified, pushes up/down queries and returns true if handled..

export type MysqlChangeLenFastPathArgs = {
    table: Table // TypeORM Table
    oldColumn: TableColumn // TypeORM TableColumn
    newColumn: TableColumn // TypeORM TableColumn
    upQueries: Query[] // Array<Query>
    downQueries: Query[] // Array<Query>
    Query: new (query: string, parameters?: any[]) => any
    escapePath: (table: any) => string
    buildCreateColumnSql: (col: any, skipIdentity?: boolean) => string
    TableColumnCtor: new (opts?: any) => any // pass your ORM's TableColumn class
}

export function handleMysqlLengthOnlyFastPathChangeColumn({
    table,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query,
    escapePath,
    buildCreateColumnSql,
    TableColumnCtor,
}: MysqlChangeLenFastPathArgs): boolean {
    // Parse lengths as integers if present
    const oldLen =
        oldColumn.length != null
            ? parseInt(String(oldColumn.length), 10)
            : undefined
    const newLen =
        newColumn.length != null
            ? parseInt(String(newColumn.length), 10)
            : undefined
    const col: string = String(oldColumn.name)

    // If shrinking, proactively truncate values that exceed the new length
    if (oldLen && newLen && newLen < oldLen) {
        upQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET \`${col}\` = LEFT(\`${col}\`, ${newLen}) WHERE CHAR_LENGTH(\`${col}\`) > ${newLen}`,
            ),
        )
        // Note: on down (reverting to larger size) we don't need a data UPDATE
    }

    // Build full column definitions to preserve all attributes (nullability, default, charset, collation, comment, etc.)
    const newColDef = new TableColumnCtor({
        ...newColumn,
        name: oldColumn.name,
    }) // avoid rename; we're only changing definition
    const oldColDef = new TableColumnCtor({
        ...oldColumn,
        name: oldColumn.name,
    })

    // Use CHANGE COLUMN so the emitted SQL matches tests expecting "MODIFY/CHANGE COLUMN"
    const up = `ALTER TABLE ${escapePath(table)} CHANGE COLUMN \`${
        oldColumn.name
    }\` ${buildCreateColumnSql(newColDef, true)}`
    const down = `ALTER TABLE ${escapePath(table)} CHANGE COLUMN \`${
        oldColumn.name
    }\` ${buildCreateColumnSql(oldColDef, true)}`

    upQueries.push(new Query(up))
    downQueries.push(new Query(down))

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

    // must return the FULL MySQL column definition (type + nullability + default + on update, etc.)
    // This should typically be: (col) => this.buildCreateColumnSql(col, /*skipIdentity?*/ true)
    buildCreateColumnSql: (column: TableColumn) => string

    executeQueries: (up: Query[], down: Query[]) => Promise<void>
    replaceCachedTable: (table: Table, cloned: Table) => void

    // your guard
    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean
}

export async function handleSafeAlterMysql({
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
    // Skip generated/computed columns (MySQL can't freely MODIFY these)
    if ((oldColumn as any).asExpression || (newColumn as any).asExpression)
        return false

    // Only proceed when caller says this change is safely widening
    if (!isSafeAlter(oldColumn, newColumn)) return false

    const tableSql = escapePath(table)
    const colName = String(oldColumn.name)
    const q = (i: string) => `\`${i.replace(/`/g, "``")}\``

    // Build full definitions to preserve attributes (NULL/DEFAULT/ON UPDATE/COLLATION/etc.)
    const newDef = buildCreateColumnSql(newColumn)
    const oldDef = buildCreateColumnSql(oldColumn)

    // MySQL syntax for type/width/precision changes
    const upSql = `ALTER TABLE ${tableSql} MODIFY COLUMN ${q(
        colName,
    )} ${newDef}`
    const downSql = `ALTER TABLE ${tableSql} MODIFY COLUMN ${q(
        colName,
    )} ${oldDef}`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    await executeQueries(upQueries, downQueries)

    // Update cached table metadata (best-effort)
    const cloned = clonedTable?.findColumnByName?.(colName)
    if (cloned) {
        cloned.type = newColumn.type
        cloned.length = newColumn.length ?? ""
        ;(cloned as any).precision = (newColumn as any).precision
        ;(cloned as any).scale = (newColumn as any).scale
        cloned.isNullable = newColumn.isNullable
        cloned.default = newColumn.default
        ;(cloned as any).charset =
            (newColumn as any).charset ?? (cloned as any).charset
        ;(cloned as any).collation =
            (newColumn as any).collation ?? (cloned as any).collation
        cloned.comment = newColumn.comment
        cloned.enum = newColumn.enum
        ;(cloned as any).unsigned = (newColumn as any).unsigned
        ;(cloned as any).zerofill = (newColumn as any).zerofill
        ;(cloned as any).width = (newColumn as any).width
        ;(cloned as any).onUpdate = (newColumn as any).onUpdate
    }
    replaceCachedTable(table, clonedTable)

    return true
}

export default handleMysqlLengthOnlyFastPathChangeColumn
