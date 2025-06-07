import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"
import { Customer } from "./customer"
import { Ticket } from "./ticket"

@Entity({ name: "orders" })
export class Order {
    @PrimaryColumn("uuid")
    id: string

    @PrimaryColumn("uuid")
    customerId: string

    @JoinColumn([{ name: "customerId", referencedColumnName: "id" }])
    @ManyToOne(() => Customer)
    customer: Customer

    @OneToMany(() => Ticket, (ticket) => ticket.order)
    tickets: Ticket[]
}
