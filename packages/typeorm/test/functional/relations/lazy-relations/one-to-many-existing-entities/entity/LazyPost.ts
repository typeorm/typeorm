import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { LazyUser } from "./LazyUser"

@Entity("lazy_post")
export class LazyPost {
    @PrimaryColumn()
    id: string

    @Column()
    name: string

    @Column({ nullable: true, name: "user_id" })
    userId: string

    @ManyToOne(() => LazyUser, (user) => user.posts)
    @JoinColumn({ name: "user_id" })
    user: Promise<LazyUser>
}
