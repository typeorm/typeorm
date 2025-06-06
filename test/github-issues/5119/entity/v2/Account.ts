import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
} from "../../../../../src/index"
import { User } from "./User"

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User)
    user: User
}
