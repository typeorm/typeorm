import {
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src/index"
import { Account } from "./Account"

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Account)
    @JoinColumn()
    account: Account
}
