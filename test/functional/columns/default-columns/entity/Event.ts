import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "tstzrange",
        default: () => "tstzrange(current_timestamp, null)",
    })
    sysPeriod: string
}
