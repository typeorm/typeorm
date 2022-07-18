import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Post } from "./Post"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    personId: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.counters.likedUsers)
    likedPosts: Post[]
}
