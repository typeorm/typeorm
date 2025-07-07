import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseEntity {
    @PrimaryColumn()
    id?: number

    // for precision 6 testing
    // `updated_date` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    @UpdateDateColumn({
        type: "timestamp",
        precision: 6,
        default: () => "CURRENT_TIMESTAMP(6)",
        onUpdate: "CURRENT_TIMESTAMP(6)",
    })
    updated_date?: Date
}
