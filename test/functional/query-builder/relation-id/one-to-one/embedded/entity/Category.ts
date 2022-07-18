import { Entity } from "../../typeorm/decorator/entity/Entity"
import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Post } from "./Post"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Post, (post) => post.counters.category)
    post: Post

    postId: number
}
