import { DeliverySlot } from "./DeliverySlot"
import { User } from "./User"
import { OrderItem } from "./OrderItem"
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"

@Entity()
export class Order {
    @PrimaryColumn()
    deliverySlotId: number

    @PrimaryColumn()
    userId: number

    @ManyToOne(() => DeliverySlot)
    deliverySlot: DeliverySlot

    @ManyToOne(() => User, (user) => user.recurringOrders)
    user: User

    @Column()
    enabled: boolean

    @OneToMany(() => OrderItem, (item) => item.order)
    items: OrderItem[]
}
