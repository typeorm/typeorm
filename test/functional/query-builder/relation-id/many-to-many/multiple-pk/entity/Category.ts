import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
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

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]

    @ManyToMany((type) => Image, (image) => image.categories)
    @JoinTable()
    images: Image[]

    postIds: number[]

    imageIds: number[]
}
