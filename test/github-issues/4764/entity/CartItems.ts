import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Cart } from "./Cart"

@Entity()
export class CartItems {
    @PrimaryGeneratedColumn()
    ID!: number

    @Column()
    CartID!: number

    @Column()
    ItemID!: number

    @Column()
    OptionID!: number

    @Column()
    Quantity!: number

    @Column()
    RegDate!: Date

    @Column()
    ModifiedDate!: Date

    @ManyToOne((type) => Cart, (t) => t.CartItems)
    @JoinColumn({ name: "CartID" })
    Cart?: Cart
}
