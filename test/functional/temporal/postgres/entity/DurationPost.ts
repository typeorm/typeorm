import { Temporal } from "@js-temporal/polyfill"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class DurationPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({ type: "interval", temporal: true })
    span!: Temporal.Duration
}
