import { Query } from "../Query"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"

// Helper for the "length-only fast path (SAP HANA)" logic.
// It modernizes schema-change handling across multiple drivers by replacing destructive drop+add
// operations with safe ALTER COLUMN … TYPE statements when only the length of a varchar (or similar)

export type HanaLengthOnlyFastPathArgs = {
    table: Table // TypeORM Table
    clonedTable: Table // TypeORM Table
    oldColumn: TableColumn // TypeORM TableColumn
    newColumn: TableColumn // TypeORM TableColumn
    upQueries: Query[] // Array<Query>
    downQueries: Query[] // Array<Query>
    Query: new (query: string, parameters?: any[]) => any
    // Methods from the runner/driver
    escapePath: (table: any) => string
    buildCreateColumnSql: (
        col: any,
        hasDefault: boolean,
        notNull: boolean,
    ) => string
    // Constructor for TableColumn used by the builder (kept generic to avoid type coupling)
    TableColumnCtor: new () => any
}

/**
 * Apply SAP HANA length-only alter logic. Returns true if handled.
 *
 * Notes:
 * - Skips columns that are arrays, primary keys, renamed, or involved in constraints/indexes.
 * - Shorten: copy through a temp column to avoid in-place shrink limitations.
 * - Widen: safe in-place ALTER; provides best-effort DOWN using temp copy.
 */
export function handleHanaLengthOnlyFastPath({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query,
    escapePath,
    buildCreateColumnSql,
    TableColumnCtor,
}: HanaLengthOnlyFastPathArgs): boolean {
    // Check for dependent indexes, foreign keys, checks, or uniques
    const colName: string = String(oldColumn.name)
    const hasIndex = Boolean(
        clonedTable?.indices?.some?.((index: any) =>
            index.columnNames?.includes?.(colName),
        ),
    )
    const hasForeignKey = Boolean(
        clonedTable?.foreignKeys?.some?.((fk: any) =>
            fk.columnNames?.includes?.(colName),
        ),
    )
    const hasCheck = Boolean(
        clonedTable?.checks?.some?.(
            (check: any) =>
                check.columnNames && check.columnNames.includes?.(colName),
        ),
    )
    const hasUnique = Boolean(
        clonedTable?.uniques?.some?.((unique: any) =>
            unique.columnNames?.includes?.(colName),
        ),
    )

    // If column participates in any constraint/index, fall back to generic path
    if (hasIndex || hasForeignKey || hasCheck || hasUnique) {
        return false
    }

    // Skip renamed columns
    if (oldColumn.name !== newColumn.name) {
        return false
    }

    const escapeColumnName = (name: string) =>
        `"${String(name).replace(/"/g, '""')}"`

    const oldLen = oldColumn.length
        ? parseInt(String(oldColumn.length), 10)
        : undefined
    const newLen = newColumn.length
        ? parseInt(String(newColumn.length), 10)
        : undefined

    // Validate that lengths are valid numbers and at least one is defined
    if (!oldLen && !newLen) {
        return false
    }
    if ((oldLen && isNaN(oldLen)) || (newLen && isNaN(newLen))) {
        return false
    }

    const col = escapeColumnName(colName)

    // ---------- SHORTEN (recreate without RENAME) ----------
    if (oldLen && newLen && newLen < oldLen) {
        const tmp = escapeColumnName(`${colName}__tmp_len`)

        // 1) ADD temp column with the *new* (shorter) length; keep NULLable for the copy
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ADD (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), newColumn, {
                            name: tmp,
                            isNullable: true, // relax during copy
                        }),
                        !(
                            newColumn.default === null ||
                            newColumn.default === undefined
                        ),
                        false, // don't force NOT NULL yet
                    ) +
                    `)`,
            ),
        )

        // 2) COPY data into temp, trimming to new length
        upQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET "${tmp}" = SUBSTRING("${col}", 1, ${newLen})`,
            ),
        )

        // 3) DROP the old column
        upQueries.push(
            new Query(`ALTER TABLE ${escapePath(table)} DROP ("${col}")`),
        )

        // 4) ADD the final column with the new definition (still NULLable for now)
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ADD (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), newColumn, {
                            name: col,
                            isNullable: true, // relax for the back-copy
                        }),
                        !(
                            newColumn.default === null ||
                            newColumn.default === undefined
                        ),
                        false,
                    ) +
                    `)`,
            ),
        )

        // 5) COPY data back from temp → final
        upQueries.push(
            new Query(`UPDATE ${escapePath(table)} SET "${col}" = "${tmp}"`),
        )

        // 6) Enforce NOT NULL (and other attributes) if needed via ALTER (...)
        if (!newColumn.isNullable) {
            upQueries.push(
                new Query(
                    `ALTER TABLE ${escapePath(table)} ALTER (` +
                        buildCreateColumnSql(
                            Object.assign(new TableColumnCtor(), newColumn, {
                                name: col,
                            }),
                            !(
                                newColumn.default === null ||
                                newColumn.default === undefined
                            ),
                            true, // NOT NULL now
                        ) +
                        `)`,
                ),
            )
        }

        // 7) DROP temp column
        upQueries.push(
            new Query(`ALTER TABLE ${escapePath(table)} DROP ("${tmp}")`),
        )

        // DOWN (best-effort): widen back to oldLen in place
        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ALTER (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), oldColumn, {
                            name: col,
                        }),
                        !(
                            oldColumn.default === null ||
                            oldColumn.default === undefined
                        ),
                        !oldColumn.isNullable,
                    ) +
                    `)`,
            ),
        )

        const updatedCol = clonedTable?.findColumnByName?.(col)
        if (updatedCol) {
            updatedCol.length = newColumn.length || ""
            updatedCol.isNullable = newColumn.isNullable
            updatedCol.default = newColumn.default
            updatedCol.comment = newColumn.comment
            updatedCol.isUnique = newColumn.isUnique
        }
        return true
    }

    // ---------- WIDEN (safe in-place ALTER) ----------
    if (oldLen && newLen && newLen > oldLen) {
        upQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ALTER (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), newColumn, {
                            name: col,
                        }),
                        !(
                            oldColumn.default === null ||
                            oldColumn.default === undefined
                        ),
                        !oldColumn.isNullable,
                    ) +
                    `)`,
            ),
        )

        // DOWN: HANA cannot shrink in-place; use copy/truncate strategy to restore old length
        const tmpDown = `${col}__tmp_down`

        // 1) ADD temp column with the *old* (shorter) length; keep NULLable for the copy
        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ADD (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), oldColumn, {
                            name: tmpDown,
                            isNullable: true,
                        }),
                        !(
                            oldColumn.default === null ||
                            oldColumn.default === undefined
                        ),
                        false,
                    ) +
                    `)`,
            ),
        )

        // 2) COPY data into temp, trimming to old length
        downQueries.push(
            new Query(
                `UPDATE ${escapePath(
                    table,
                )} SET "${tmpDown}" = SUBSTRING("${col}", 1, ${oldLen})`,
            ),
        )

        // 3) DROP the widened column
        downQueries.push(
            new Query(`ALTER TABLE ${escapePath(table)} DROP ("${col}")`),
        )

        // 4) ADD the final column with the old definition (NULLable for now)
        downQueries.push(
            new Query(
                `ALTER TABLE ${escapePath(table)} ADD (` +
                    buildCreateColumnSql(
                        Object.assign(new TableColumnCtor(), oldColumn, {
                            name: col,
                            isNullable: true,
                        }),
                        !(
                            oldColumn.default === null ||
                            oldColumn.default === undefined
                        ),
                        false,
                    ) +
                    `)`,
            ),
        )

        // 5) COPY data back from temp → final
        downQueries.push(
            new Query(
                `UPDATE ${escapePath(table)} SET "${col}" = "${tmpDown}"`,
            ),
        )

        // 6) Enforce NOT NULL if needed
        if (!oldColumn.isNullable) {
            downQueries.push(
                new Query(
                    `ALTER TABLE ${escapePath(table)} ALTER (` +
                        buildCreateColumnSql(
                            Object.assign(new TableColumnCtor(), oldColumn, {
                                name: col,
                            }),
                            !(
                                oldColumn.default === null ||
                                oldColumn.default === undefined
                            ),
                            true,
                        ) +
                        `)`,
                ),
            )
        }

        // 7) DROP temp column
        downQueries.push(
            new Query(`ALTER TABLE ${escapePath(table)} DROP ("${tmpDown}")`),
        )
        return true
    }

    // If lengths are equal or no valid comparison, fall back to generic path
    return false
}

export type SapSafeAlterArgs = {
    table: Table
    clonedTable: Table
    oldColumn: TableColumn
    newColumn: TableColumn

    // infra / helpers from the runner
    upQueries: Query[]
    downQueries: Query[]
    Query: typeof Query
    escapePath: (target: string | Table) => string

    // your guard
    isSafeAlter: (oldCol: TableColumn, newCol: TableColumn) => boolean

    // must return a HANA TYPE fragment like: "NVARCHAR(200)", "DECIMAL(12,2)", "TIMESTAMP"
    buildColumnType: (column: TableColumn) => string
}

export async function handleSafeAlterSap({
    table,
    clonedTable,
    oldColumn,
    newColumn,
    upQueries,
    downQueries,
    Query: QueryCtor,
    escapePath,
    isSafeAlter,
    buildColumnType,
}: SapSafeAlterArgs): Promise<boolean> {
    // Skip generated/computed/identity
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

    // TYPE-only fragments (nullability/default unchanged)
    const newType = buildColumnType(newColumn)
    const oldType = buildColumnType(oldColumn)

    // SAP HANA syntax: ALTER TABLE <t> ALTER (<col> <type>)
    const upSql = `ALTER TABLE ${tableSql} ALTER (${q(colName)} ${newType})`
    const downSql = `ALTER TABLE ${tableSql} ALTER (${q(colName)} ${oldType})`

    upQueries.push(new QueryCtor(upSql))
    downQueries.push(new QueryCtor(downSql))

    return true
}

export default handleHanaLengthOnlyFastPath
