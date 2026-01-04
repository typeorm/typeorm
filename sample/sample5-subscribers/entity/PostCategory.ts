import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Post } from "./Post"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"

@Entity("sample5_post_category")
export class PostCategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Post, (post) => post.categories, {
        cascade: true,
    })
    posts: Post[] = []
}
