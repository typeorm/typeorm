import { expect } from "chai"
import type { DataSource } from "../../../../src"

/**
 * Fetches the live names of indices present on a table. Works across drivers
 * via the portable `getTable()` API.
 */
export async function getIndexNames(
    dataSource: DataSource,
    tableName: string,
): Promise<string[]> {
    const qr = dataSource.createQueryRunner()
    try {
        const table = await qr.getTable(tableName)
        return table?.indices.map((i) => i.name ?? "") ?? []
    } finally {
        await qr.release()
    }
}

/**
 * Fetches the live names of unique constraints present on a table.
 */
export async function getUniqueNames(
    dataSource: DataSource,
    tableName: string,
): Promise<string[]> {
    const qr = dataSource.createQueryRunner()
    try {
        const table = await qr.getTable(tableName)
        return table?.uniques.map((u) => u.name ?? "") ?? []
    } finally {
        await qr.release()
    }
}

/**
 * Asserts that a SchemaBuilder log's upQueries do not DROP the given artifact
 * name. Covers dialect variants: `DROP INDEX <name>`, `DROP CONSTRAINT <name>`,
 * `ALTER TABLE ... DROP CONSTRAINT <name>`, etc. Case-insensitive — MSSQL
 * emits mixed case for system stored procedures.
 */
export function expectNoDropOfName(
    upQueries: readonly { query: string }[],
    oldName: string,
) {
    const sql = upQueries.map((q) => q.query).join(" | ")
    const escaped = oldName.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")
    expect(sql).to.not.match(
        new RegExp(`DROP[^|]*${escaped}`, "i"),
        `expected no DROP of "${oldName}" in: ${sql}`,
    )
}

/**
 * Asserts that a second `synchronize()` emits zero DDL — proves the first
 * pass left the DB in a state convergent with metadata.
 */
export async function expectSyncIsIdempotent(dataSource: DataSource) {
    await dataSource.synchronize()
    const log = await dataSource.driver.createSchemaBuilder().log()
    expect(log.upQueries, "second sync should produce no DDL").to.be.empty
}
