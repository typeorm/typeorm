import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class EventRespond {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    eventId: number

    @Column()
    userId: number

    @Column()
    status: string
}
