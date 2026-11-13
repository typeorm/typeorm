import { Temporal } from "@js-temporal/polyfill"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class ZonedPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({
        type: "timestamptz",
        temporal: { timeZone: "Asia/Seoul" },
    })
    scheduledAt!: Temporal.ZonedDateTime
}
