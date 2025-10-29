import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

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
