import {DeliverySlot} from "./DeliverySlot";
import {User} from "./User";
import {OrderItem} from "./OrderItem";
import {Column, Entity, ManyToOne, OneToMany} from "../../../../src";

@Entity()
export class Order {

    @ManyToOne(type => DeliverySlot, { primary: true })
    deliverySlot: DeliverySlot;

    @ManyToOne(type => User, user => user.recurringOrders, { primary: true })
    user: User;

    @Column()
    enabled: boolean;

    @OneToMany(type => OrderItem, item => item.order)
    items: OrderItem[];
}
