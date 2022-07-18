import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToMany((type) => Post, (post) => post.counters.subcntrs.watchedUsers)
    posts: Post[]

    postIds: number[]
}
