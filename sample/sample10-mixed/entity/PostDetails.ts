import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { Post } from "./Post"
import { Chapter } from "./Chapter"
import { Category } from "./Category"

@Entity("sample10_post_details")
export class PostDetails {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    meta: string

    @Column()
    comment: string

    @OneToOne(() => Post, (post) => post.details)
    post: Post

    @OneToMany(() => Category, (category) => category.details, {
        cascade: ["insert"],
    })
    categories: Category[]

    @ManyToOne(() => Chapter, (chapter) => chapter.postDetails, {
        cascade: ["insert"],
    })
    chapter: Chapter
}
