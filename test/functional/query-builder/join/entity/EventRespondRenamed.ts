import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity("event_respond_renamed")
export class EventRespondRenamed {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "event_id" })
    eventId: number

    @Column({ name: "user_id" })
    userId: number

    @Column()
    status: string
}
