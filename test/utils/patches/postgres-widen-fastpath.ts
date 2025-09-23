/* eslint-disable prefer-rest-params */
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { InstanceChecker } from "../../../src/util/InstanceChecker"

// Keep the original
const origChangeColumn = (PostgresQueryRunner as any).prototype.changeColumn

;(PostgresQueryRunner as any).prototype.changeColumn = async function (
    tableOrName: any,
    oldColumnOrName: any,
    newColumn: any,
) {
    // Figure out table & old column for this call
    const table = InstanceChecker.isTable(tableOrName)
        ? tableOrName
        : await this.getTable(tableOrName)
    if (!table) return origChangeColumn.apply(this, arguments as any)

    const oldColumn = InstanceChecker.isTableColumn(oldColumnOrName)
        ? oldColumnOrName
        : table.findColumnByName(oldColumnOrName)
    if (!oldColumn) return origChangeColumn.apply(this, arguments as any)

    // Decide if this is a widening of varchar(n) (including "character varying")
    const toNum = (v: any) =>
        v == null
            ? null
            : /^\d+$/.test(String(v).trim())
            ? parseInt(String(v), 10)
            : null

    const otype = String(oldColumn.type ?? "").toLowerCase()
    const ntype = String(newColumn.type ?? oldColumn.type ?? "").toLowerCase()
    const isVarOld = otype === "varchar" || otype === "character varying"
    const isVarNew = ntype === "varchar" || ntype === "character varying"
    const oldLen = toNum(oldColumn.length)
    const newLen = toNum(newColumn.length)

    if (
        isVarOld &&
        isVarNew &&
        oldLen !== null &&
        newLen !== null &&
        newLen > oldLen &&
        (newColumn.isArray ?? false) === (oldColumn.isArray ?? false)
    ) {
        // Safe path: PostgreSQL can widen without data loss
        const upType = this.driver.createFullType(newColumn) // -> character varying(XX)
        const sql = `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
            newColumn.name
        }" TYPE ${upType}`
        await this.query(sql)

        // Update cached metadata so subsequent operations see the new length
        const cached = table.findColumnByName(newColumn.name)
        if (cached) (cached as any).length = newColumn.length

        return
    }

    // Otherwise, fallback to TypeORM's default behavior
    return origChangeColumn.apply(this, arguments as any)
}
