import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Post } from "./Post"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToOne((type) => Post, (post) => post.counters.categories)
    post: Post
}
