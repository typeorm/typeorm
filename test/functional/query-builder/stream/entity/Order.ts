import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
} from "../../../../../src"
import { User } from "./User"
import { Payment } from "./Payment"
import { Item } from "./Item"

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    enabled: boolean

    @CreateDateColumn()
    created_at: Date

    @ManyToOne(() => User)
    user: User

    @OneToMany(() => Payment, (payment: Payment) => payment.order)
    payments: Payment[]

    @OneToMany(() => Item, (item: Item) => item.order)
    items: Item[]
}
