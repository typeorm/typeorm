import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { Column } from "../typeorm/decorator/columns/Column"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { RelationId } from "../typeorm/decorator/relations/RelationId"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Post, (post) => post.category)
    posts: Post[]

    @RelationId((category: Category) => category.posts)
    postIds: number[]

    @RelationId((category: Category) => category.posts, "removedPosts", (qb) =>
        qb.andWhere("removedPosts.isRemoved = :isRemoved", { isRemoved: true }),
    )
    removedPostIds: number[]
}
