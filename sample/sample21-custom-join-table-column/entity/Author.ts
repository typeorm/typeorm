import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Post } from "./Post"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"

@Entity("sample21_author")
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (post) => post.author, {
        cascade: true,
    })
    posts: Post[]
}
