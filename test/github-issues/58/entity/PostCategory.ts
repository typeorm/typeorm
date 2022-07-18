import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { PrimaryColumn } from "typeorm"

@Entity()
export class PostCategory {
    @PrimaryColumn()
    postId: number

    @PrimaryColumn()
    categoryId: number

    @ManyToOne((type) => Post, (post) => post.categories, {
        cascade: ["insert"],
    })
    post: Post

    @ManyToOne((type) => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    category: Category

    @Column()
    addedByAdmin: boolean

    @Column()
    addedByUser: boolean
}
