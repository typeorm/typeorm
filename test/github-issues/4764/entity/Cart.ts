import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { CartItems } from "./CartItems"
import { User } from "./User"

@Entity()
export class Cart {
    @PrimaryGeneratedColumn()
    ID!: number

    @Column()
    UNID!: number

    @Column()
    Type!: string

    @Column()
    Cycle?: number

    @Column()
    Term?: string

    @Column()
    RegDate!: Date

    @Column()
    ModifiedDate!: Date

    @OneToMany((type) => CartItems, (t) => t.Cart)
    CartItems?: CartItems[]

    @OneToOne((type) => User, (t) => t.Cart)
    @JoinColumn({ name: "UNID" })
    User?: User
}
