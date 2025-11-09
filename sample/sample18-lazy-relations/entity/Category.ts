import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { Post } from "./Post"

@Entity("sample18_category")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Post, (post) => post.categories)
    posts: Promise<Post[]>
}
