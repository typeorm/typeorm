import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Post } from "./Post"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column()
    title: string

    @ManyToOne(() => Post, (post) => post.comments)
    post: Post

    constructor(title?: string) {
        if (title) this.title = title
    }
}
