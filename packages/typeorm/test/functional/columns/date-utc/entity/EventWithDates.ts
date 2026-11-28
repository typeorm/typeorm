import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity({
    name: "event_with_dates",
})
export class EventWithDates {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "date", array: true, utc: true, nullable: true })
    utcDates: Date[] | null
}
