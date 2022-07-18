import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Image } from "./Image"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @OneToMany((type) => Image, (image) => image.category)
    images: Image[]

    imageIds: number[]

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post

    postId: number
}
