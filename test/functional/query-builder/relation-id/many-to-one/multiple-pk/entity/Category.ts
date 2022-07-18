import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
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

    @OneToMany((type) => Post, (post) => post.category)
    posts: Post[]

    @ManyToOne((type) => Image, (image) => image.categories)
    @JoinTable()
    image: Image

    postIds: number[]

    imageId: number[]
}
