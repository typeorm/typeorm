import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Comment } from "./Comment"
import { Post } from "./Post"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.author, { eager: true })
    posts: Post

    @OneToMany(() => Comment, (comment) => comment.author)
    comments: Comment[]

    @ManyToMany(() => Post)
    @JoinTable({
        name: "like",
    })
    likedPosts: Post[]
}
