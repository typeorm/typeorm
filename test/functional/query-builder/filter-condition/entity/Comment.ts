import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../../src"
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
}
