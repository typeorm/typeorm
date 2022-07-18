import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Post } from "./Post"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Post, (post) => post.counters.likedUsers)
    @JoinTable()
    likedPosts: Post[]
}
