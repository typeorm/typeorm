import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { Product } from "./Product"
import { Ticket } from "./Ticket"

@Entity()
export class TicketProduct {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Product, (product) => product.ticketProduct)
    product: Product

    @ManyToOne(() => Ticket, (ticket) => ticket.ticketItems)
    ticket: Ticket
}
