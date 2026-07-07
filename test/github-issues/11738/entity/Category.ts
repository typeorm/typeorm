import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(() => Post, (post) => post.categories)
    posts: Post[]
}
