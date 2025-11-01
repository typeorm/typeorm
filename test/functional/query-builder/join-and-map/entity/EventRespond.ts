import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

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
