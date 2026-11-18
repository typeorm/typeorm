import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    Index,
} from "../../../../../src"
import { User } from "./User"

@Entity({ name: "simple_example" })
@Index("IDX_USER_ID_CHOICE", ["userId", "choice"], { unique: true })
export class SimpleExample {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "user_id", nullable: false })
    userId: number

    @Index("IDX_CHOICE")
    @Column({ name: "choice", nullable: true })
    choice: number

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User
}
