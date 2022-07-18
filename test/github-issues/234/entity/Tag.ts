import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Post } from "./Post"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.tags)
    posts: Promise<Post[]>
}
