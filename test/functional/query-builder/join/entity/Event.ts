import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"
import type { EventRespond } from "./EventRespond"
import type { EventRespondRenamed } from "./EventRespondRenamed"

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    /**
     * Virtual property mapped via leftJoinAndMapOne.
     * Not a real column — populated by query builder.
     */
    myRespond: EventRespond | EventRespondRenamed | null

    /**
     * Virtual property mapped via leftJoinAndMapMany.
     * Not a real column — populated by query builder.
     */
    myResponds: EventRespond[]
}
