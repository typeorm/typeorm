import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { TicketProduct } from "./TicketProduct"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany((type) => TicketProduct, (ticketp) => ticketp.product)
    ticketProduct: TicketProduct[]
}
