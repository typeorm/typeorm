import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Post, (post) => post.counters.likedUser)
    likedPosts: Post[]
}
