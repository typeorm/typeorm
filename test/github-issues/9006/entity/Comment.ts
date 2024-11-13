import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"
import { Book } from "./Book"

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
    bookId: number

    @JoinColumn({ name: "bookId" })
    @ManyToOne(() => Book)
    book: Book
}
