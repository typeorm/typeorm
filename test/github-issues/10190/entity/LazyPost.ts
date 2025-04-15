import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryColumn,
} from "../../../../src"
import { LazyUser } from "./LazyUser"

@Entity("lazy_post")
export class LazyPost {
    @PrimaryColumn({ type: "varchar" })
    id: string

    @Column()
    name: string

    @Column({ nullable: true, name: "user_id" })
    userId: string

    @ManyToOne(() => LazyUser, (u) => u.posts)
    @JoinColumn({ name: "user_id" })
    user: Promise<LazyUser>
}
