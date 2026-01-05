import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { PostCategory } from "./PostCategory"
import { PostAuthor } from "./PostAuthor"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"

@Entity("sample5_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne(() => PostAuthor, (post) => post.posts, {
        cascade: true,
    })
    author: PostAuthor

    @ManyToMany(() => PostCategory, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable()
    categories: PostCategory[] = []
}
