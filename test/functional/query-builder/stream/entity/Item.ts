import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../../src"
import { Product } from "./Product"
import { Order } from "./Order"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number

    @ManyToOne(() => Product)
    product: Product

    @ManyToOne(() => Order, (order: Order) => order.items)
    order: Order
}
