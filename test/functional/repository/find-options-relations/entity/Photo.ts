import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/index"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Post } from "./Post"
import { Counters } from "./Counters"
import { User } from "./User"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    filename: string

    @ManyToOne((type) => User)
    user: User

    @ManyToOne((type) => Post, (post) => post.photos)
    post: Post

    @Column((type) => Counters)
    counters: Counters
}
