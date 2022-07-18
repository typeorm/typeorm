import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.counters.likedUsers)
    likedPosts: Post[]
}
