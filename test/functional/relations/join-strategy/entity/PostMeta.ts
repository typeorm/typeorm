import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Post } from "./Post"

@Entity()
export class PostMeta {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string

    // Owner side — has the join column
    @OneToOne(() => Post, (post) => post.meta)
    @JoinColumn()
    post: Post
}
