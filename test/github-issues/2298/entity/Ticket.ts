import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { TicketProduct } from "./TicketProduct"

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    shopId: string

    @Column()
    chainId: string

    @OneToMany((type) => TicketProduct, (ticketProduct) => ticketProduct.ticket)
    ticketItems: TicketProduct[]
}
