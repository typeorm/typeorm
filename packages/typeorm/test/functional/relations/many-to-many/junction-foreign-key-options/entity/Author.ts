import {
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Book } from "./Book"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(() => Book, (book) => book.authors)
    @JoinTable({
        name: "author_books",
        joinColumn: { name: "author_id" },
        inverseJoinColumn: {
            name: "book_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            deferrable: "INITIALLY IMMEDIATE",
        },
    })
    books: Book[]
}
