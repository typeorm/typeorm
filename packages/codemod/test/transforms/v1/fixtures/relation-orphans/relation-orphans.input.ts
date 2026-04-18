import { Entity, OneToMany, ManyToOne } from "typeorm"
import { Post } from "./Post"

@Entity()
export class Author {
    @OneToMany(() => Post, (post) => post.author, {
        orphanedRowAction: "delete",
    })
    posts: Post[]
}

@Entity()
export class Comment {
    @ManyToOne(() => Post, (post) => post.comments, {
        orphanedRowAction: "delete",
    })
    post: Post
}
