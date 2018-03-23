import {Column, Entity, ManyToOne} from "../../../../src";
import {Order} from "./Order";
import {Product} from "./Product";

@Entity()
export class OrderItem {

    @ManyToOne(type => Order, recurringOrder => recurringOrder.items, { primary: true })
    order: Order;

    @ManyToOne(type => Product, { primary: true })
    product: Product;

    @Column()
    amount: number;

}
