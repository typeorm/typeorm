import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { Post } from "./post.entity"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Post, (post) => post.comments)
    post: Post;
}
