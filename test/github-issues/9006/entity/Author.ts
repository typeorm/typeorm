import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Book } from "./Book"
import { Comment } from "./Comment"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @JoinTable({
        name: "AuthorBooks",
    })
    @ManyToMany(() => Book, (book) => book.author, { eager: true })
    books: Book

    @OneToMany(() => Comment, (comment) => comment.author)
    comments: Comment[]
}
