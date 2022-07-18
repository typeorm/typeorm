import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../typeorm/decorator/columns/Column"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { Post } from "./Post"
import { Image } from "./Image"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.categories)
    posts: Post[]

    @ManyToMany((type) => Image)
    @JoinTable()
    images: Image[]

    imageIds: number[]

    postIds: number[]
}
