import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Product } from "./Product"
import { Ticket } from "./Ticket"

@Entity()
export class TicketProduct {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne((type) => Product, (product) => product.ticketProduct)
    product: Product

    @ManyToOne((type) => Ticket, (ticket) => ticket.ticketItems)
    ticket: Ticket
}
