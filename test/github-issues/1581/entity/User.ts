import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Order } from "./Order"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email: string

    @OneToMany(() => Order, (recurringOrder) => recurringOrder.user)
    recurringOrders: Order[]
}
