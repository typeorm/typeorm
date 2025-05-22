import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { Customer } from "./customer"
import { Order } from "./order"

@Entity({ name: "tickets" })
export class Ticket {
    @PrimaryColumn("uuid")
    id: string

    @PrimaryColumn("uuid")
    customerId: string

    @Column({ nullable: true, type: "uuid" })
    orderId: string

    @JoinColumn([{ name: "customerId", referencedColumnName: "id" }])
    @ManyToOne(() => Customer)
    customer: Customer

    @ManyToOne(() => Order, (order) => order.tickets, { nullable: true })
    @JoinColumn([
        { name: "orderId", referencedColumnName: "id" },
        { name: "customerId", referencedColumnName: "customerId" },
    ])
    order: Order | null
}
