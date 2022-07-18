import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToOne((type) => Post, (post) => post.counters.subcounters.watchedUsers)
    post: Post
}
