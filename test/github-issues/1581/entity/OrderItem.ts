import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../src"
import { Order } from "./Order"
import { Product } from "./Product"

@Entity()
export class OrderItem {
    @PrimaryColumn()
    orderId: number

    @PrimaryColumn()
    productId: number

    @ManyToOne(() => Order, (recurringOrder) => recurringOrder.items)
    order: Order

    @ManyToOne(() => Product)
    product: Product

    @Column()
    amount: number
}
