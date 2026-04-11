import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from "../../../../src"
import { User } from "./User"

@Entity()
export class Address {
    @PrimaryGeneratedColumn("increment")
    id?: number

    @Column()
    city: string

    @Column()
    state: string

    @ManyToOne(() => User, (user) => user.addresses)
    user: User
}
