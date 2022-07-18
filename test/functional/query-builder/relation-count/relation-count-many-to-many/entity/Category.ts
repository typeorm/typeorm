import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { Post } from "./Post"
import { Image } from "./Image"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]

    @ManyToMany((type) => Image, (image) => image.categories)
    @JoinTable()
    images: Image[]

    postCount: number

    removedPostCount: number

    imageCount: number

    removedImageCount: number
}
