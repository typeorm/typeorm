import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { RelationId } from "typeorm/decorator/relations/RelationId"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"

@Entity()
export class Category {
    @PrimaryColumn()
    firstId: number

    @PrimaryColumn()
    secondId: number

    @Column()
    name: string

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post | null

    @RelationId((category: Category) => category.post)
    postId: number

    @ManyToMany((type) => Post, (post) => post.manyCategories)
    manyPosts: Post[]

    @RelationId((category: Category) => category.manyPosts)
    manyPostIds: number[]
}
