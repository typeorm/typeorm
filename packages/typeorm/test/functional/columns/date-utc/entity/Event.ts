import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity({
    name: "event",
})
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "date" })
    localDate: Date

    @Column({ type: "date", utc: true })
    utcDate: Date
}
