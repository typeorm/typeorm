import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { TicketProduct } from "./TicketProduct"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => TicketProduct, (ticketp) => ticketp.product)
    ticketProduct: TicketProduct[]

    constructor(name: string) {
        this.name = name
    }
}
