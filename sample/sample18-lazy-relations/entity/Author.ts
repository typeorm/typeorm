import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Post } from "./Post"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"

@Entity("sample18_author")
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Post, (post) => post.author, {
        cascade: true,
    })
    posts: Promise<Post[]>

    /**
     * You can add this helper method.
     */
    asPromise() {
        return Promise.resolve(this)
    }
}
