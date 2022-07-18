import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm"
import { Cart } from "./Cart"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    ID!: number

    @Column()
    name!: string

    @Column()
    RegDate!: Date

    @Column()
    ModifiedDate!: Date

    @OneToOne((type) => Cart, (t) => t.User)
    Cart?: Cart
}
