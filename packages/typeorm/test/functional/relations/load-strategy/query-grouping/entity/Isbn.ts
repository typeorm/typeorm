import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Book } from "./Book"

@Entity()
export class Isbn {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    code: string

    @OneToOne(() => Book, (book) => book.isbn)
    book: Book | null
}
