import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Post } from "./Post"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    position: number

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]
}
