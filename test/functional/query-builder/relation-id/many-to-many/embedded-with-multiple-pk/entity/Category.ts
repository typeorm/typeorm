import { Entity } from "../../typeorm/decorator/entity/Entity"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToMany((type) => Post, (post) => post.counters.categories)
    posts: Post[]

    postIds: number[]
}
