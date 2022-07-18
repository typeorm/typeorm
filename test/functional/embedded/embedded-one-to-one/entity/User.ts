import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Post } from "./Post"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToOne(() => Post, (post) => post.counters.likedUser)
    likedPost: Post
}
