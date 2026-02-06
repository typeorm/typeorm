import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../../src"
import { Order } from "./Order"

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    amount: number

    @ManyToOne(() => Order, (order: Order) => order.payments)
    order: Order
}
