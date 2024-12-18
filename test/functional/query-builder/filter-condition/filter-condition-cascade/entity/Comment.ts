import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { CommentLike } from "./CommentLike"
import { Post } from "./Post"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    content: string

    @ManyToOne(() => Post, (post) => post.comments, {
        filterConditionCascade: true,
    })
    post: Post

    @OneToMany(() => CommentLike, (commentLike) => commentLike.comment)
    commentLikes: CommentLike[]
}
