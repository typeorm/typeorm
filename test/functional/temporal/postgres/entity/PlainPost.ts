import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"
import type { Temporal } from "../../../../../src/util/Temporal"

@Entity()
export class PlainPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({ type: "timestamp", temporal: true })
    happenedAt!: Temporal.PlainDateTime

    @Column({ type: "date", temporal: true })
    onDate!: Temporal.PlainDate

    @Column({ type: "time", temporal: true })
    atTime!: Temporal.PlainTime
}
