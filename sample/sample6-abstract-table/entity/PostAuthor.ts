import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Post } from "./Post"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"

@Entity("sample6_post_author")
export class PostAuthor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.author)
    posts: Post[]
}
