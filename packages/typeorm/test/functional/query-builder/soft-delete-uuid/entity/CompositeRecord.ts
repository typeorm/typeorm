import { Entity, PrimaryColumn } from "../../../../../src"
import { Record } from "./Record"

@Entity()
export class CompositeRecord extends Record {
    @PrimaryColumn({ type: "timestamp", precision: 3 })
    partition: Date
}
