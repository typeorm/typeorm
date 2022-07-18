import { Entity } from "../../typeorm/decorator/entity/Entity"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { Category } from "./Category"
import { Image } from "./Image"
import { PrimaryColumn } from "../../typeorm"

@Entity()
export class PostCategory {
    @PrimaryColumn()
    postId: number

    @PrimaryColumn()
    categoryId: number

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post

    @ManyToOne((type) => Category, (category) => category.posts)
    category: Category

    @ManyToOne((type) => Image)
    image: Image

    imageId: number
}
