import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseSqliteEntity {
    @PrimaryColumn()
    id?: number

    // SQLite precision 0 testing - uses datetime with datetime('now')
    // SQLite doesn't support timestamp type, uses datetime instead
    // SQLite datetime('now') returns format: YYYY-MM-DD HH:MM:SS (no fractional seconds)
    @UpdateDateColumn({
        type: "datetime",
        precision: 0, // SQLite datetime precision 0 (no fractional seconds)
        default: () => "datetime('now')",
        onUpdate: "datetime('now')",
    })
    updated_date?: Date
}
