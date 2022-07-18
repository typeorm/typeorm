import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post

    @Column()
    name: string
}
