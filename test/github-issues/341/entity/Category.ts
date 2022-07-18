import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    name: string

    @OneToOne((type) => Post, (post) => post.category)
    post: Post
}
