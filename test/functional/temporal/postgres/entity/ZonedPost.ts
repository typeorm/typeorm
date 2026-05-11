import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"
import type { Temporal } from "../../../../../src/util/Temporal"

@Entity()
export class ZonedPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({
        type: "timestamptz",
        temporal: { timeZone: "Asia/Seoul" },
    })
    scheduledAt!: Temporal.ZonedDateTime
}
