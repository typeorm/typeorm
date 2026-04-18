import { Entity, OneToMany, ManyToOne } from "typeorm"
import { Post } from "./Post"

@Entity()
export class Author {
    @OneToMany(() => Post, (post) => post.author, {
        // TODO: rename "orphanedRowAction" to "orphans" — see https://typeorm.io/docs/releases/1.0/upgrading-from-0.3
        // TODO: the implicit "nullify" default is deprecated and will change in v2.0. Set "orphans" explicitly. See #12343
        orphanedRowAction: "delete",
    })
    posts: Post[]
}

@Entity()
export class Comment {
    @ManyToOne(() => Post, (post) => post.comments, {
        // TODO: "orphanedRowAction" is no longer supported on @ManyToOne in v1.0 — move to the corresponding @OneToMany and rename to "orphans"
        orphanedRowAction: "delete",
    })
    post: Post
}
