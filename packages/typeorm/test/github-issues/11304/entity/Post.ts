import {
    Column,
    Entity,
    Generated,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { idTransformer } from "../transformer"
import { User } from "./User"

@Entity()
export class Post {
    @Generated("increment")
    @PrimaryColumn({ type: "integer", transformer: idTransformer })
    id: string

    @Column()
    title: string

    @Column({ type: "integer", transformer: idTransformer })
    userId: string

    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: "userId" })
    user: User
}
