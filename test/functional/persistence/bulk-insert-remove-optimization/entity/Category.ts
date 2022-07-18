import { Entity } from "typeorm/decorator/entity/Entity"
import { Post } from "./Post"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]
}
