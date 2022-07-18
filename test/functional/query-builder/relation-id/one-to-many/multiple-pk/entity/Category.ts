import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { OneToMany } from "../../typeorm/decorator/relations/OneToMany"
import { Post } from "./Post"
import { Image } from "./Image"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    code: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post

    @OneToMany((type) => Image, (image) => image.category)
    images: Image[]

    postId: number

    imageIds: number[]
}
