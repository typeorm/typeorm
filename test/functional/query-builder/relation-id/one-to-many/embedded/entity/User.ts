import { Column } from "../../typeorm/decorator/columns/Column"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"
import { Post } from "./Post"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Post, (post) => post.counters.subcounters.watchedUsers)
    @JoinColumn()
    posts: Post[]
}
