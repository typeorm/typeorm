import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Ticket } from "./Ticket"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Request {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    owner: string

    @Column()
    type: string

    @Column()
    success: boolean

    @OneToOne((type) => Ticket, (ticket) => ticket.request)
    ticket: Ticket
}
