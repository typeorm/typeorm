import { QueryRunner } from "../query-runner/QueryRunner"
import { Table } from "../schema-builder/table/Table"
import { TableColumn } from "../schema-builder/table/TableColumn"

export async function ensureColumnMinLength(
    runner: QueryRunner,
    tablePath: string,
    columnName: string,
    desiredLength: number,
): Promise<void> {
    const table: Table | undefined = await runner.getTable(tablePath)
    if (!table) return
    const oldCol = table.findColumnByName(columnName)
    if (!oldCol) return

    const currentLen =
        oldCol.length != null ? parseInt(oldCol.length, 10) : undefined
    if (currentLen == null) return // engines that don't report length (e.g., SQLite)
    if (currentLen >= desiredLength) return // already large enough

    const newCol = new TableColumn({ ...oldCol, length: String(desiredLength) })
    await runner.changeColumn(tablePath, oldCol, newCol)
}
