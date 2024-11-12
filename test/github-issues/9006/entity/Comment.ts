import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"
import { Post } from "./Post"

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @Column()
    authorId: number

    @JoinColumn({ name: "authorId" })
    @ManyToOne(() => Author)
    author: Author

    @Column()
    postId: number

    @JoinColumn({ name: "postId" })
    @ManyToOne(() => Post)
    post: Post
}
