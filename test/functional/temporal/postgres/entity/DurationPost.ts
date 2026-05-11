import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"
import type { Temporal } from "../../../../../src/util/Temporal"

@Entity()
export class DurationPost {
    @PrimaryGeneratedColumn() id!: number

    @Column({ type: "interval", temporal: true })
    span!: Temporal.Duration
}
