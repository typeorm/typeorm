import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { Post } from "./Post"
import { Image } from "./Image"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post

    @OneToMany((type) => Image, (image) => image.category)
    images: Image[]

    imageCount: number
}
