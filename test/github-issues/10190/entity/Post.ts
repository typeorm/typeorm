import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryColumn,
} from "../../../../src"
import { User } from "./User"

@Entity("post")
export class Post {
    @PrimaryColumn({ type: "varchar" })
    id: string

    @Column()
    name: string

    @Column({ nullable: true, name: "user_id" })
    userId: string

    @ManyToOne(() => User, (u) => u.posts)
    @JoinColumn({ name: "user_id" })
    user: User
}
