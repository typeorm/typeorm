import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"
import { Comment } from "./Comment"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column()
    authorId: number

    @JoinColumn({ name: "authorId" })
    @ManyToOne(() => Author)
    author: Author

    @OneToMany(() => Comment, (comment) => comment.post, { eager: true })
    comments: Comment[]

    @ManyToMany(() => Author, { eager: true })
    @JoinTable({
        name: "like",
    })
    likeAuthors: Author[]
}
