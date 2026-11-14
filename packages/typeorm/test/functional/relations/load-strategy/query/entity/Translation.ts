import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { Book } from "./Book"

@Entity()
export class Translation {
    @PrimaryColumn()
    bookId: number

    @PrimaryColumn()
    language: string

    @Column()
    title: string

    @JoinColumn({ name: "bookId" })
    @ManyToOne(() => Book, (book) => book.translations)
    book: Book
}
