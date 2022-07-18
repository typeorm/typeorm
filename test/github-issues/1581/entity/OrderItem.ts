import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Order } from "./Order"
import { Product } from "./Product"

@Entity()
export class OrderItem {
    @PrimaryColumn()
    orderId: number

    @PrimaryColumn()
    productId: number

    @ManyToOne((type) => Order, (recurringOrder) => recurringOrder.items)
    order: Order

    @ManyToOne((type) => Product)
    product: Product

    @Column()
    amount: number
}
