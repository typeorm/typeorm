import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @ManyToMany((type) => Post, (post) => post.images)
    posts: Post[]
}
