import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseSqliteEntity {
    @PrimaryColumn()
    id?: number

    // SQLite precision 6 testing - uses datetime with fractional seconds
    // SQLite datetime can store fractional seconds: YYYY-MM-DD HH:MM:SS.SSS
    // Note: SQLite actually supports up to 3 decimal places for fractional seconds
    // but we'll use precision 6 in the decorator for consistency with other tests
    @UpdateDateColumn({
        type: "datetime",
        precision: 6, // SQLite datetime with fractional seconds
        default: () => "STRFTIME('%Y-%m-%d %H:%M:%f', 'now')",
        onUpdate: "STRFTIME('%Y-%m-%d %H:%M:%f', 'now')",
    })
    updated_date?: Date
}
