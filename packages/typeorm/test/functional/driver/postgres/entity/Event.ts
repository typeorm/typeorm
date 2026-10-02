import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column("date", { array: true })
    dates: string[]
}
