import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"
import { Post } from "./Post"

@Entity("sample25_author")
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Post, (author) => author.author)
    posts: Post[]
}
