import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { User } from "./User"

@Entity("post")
export class Post {
    @PrimaryColumn()
    id: string

    @Column()
    name: string

    @Column({ nullable: true, name: "user_id" })
    userId: string

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: "user_id" })
    user: User
}
