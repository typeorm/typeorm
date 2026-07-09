import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseEntity {
    @PrimaryColumn()
    id?: number

    // for precision 0 testing - explicit timestamp without precision
    // `updated_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    @UpdateDateColumn({
        type: "timestamp",
        precision: 0, // Explicitly set to 0 to avoid default precision 6
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    updated_date?: Date
}
