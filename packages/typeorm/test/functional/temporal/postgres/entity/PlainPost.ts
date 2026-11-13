import { Temporal } from "@js-temporal/polyfill"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

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
