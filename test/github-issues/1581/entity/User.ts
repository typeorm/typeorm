import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm"
import { Order } from "./Order"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email: string

    @OneToMany((type) => Order, (recurringOrder) => recurringOrder.user)
    recurringOrders: Order[]
}
