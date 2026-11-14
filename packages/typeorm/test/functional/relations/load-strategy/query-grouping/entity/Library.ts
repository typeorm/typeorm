import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Book } from "./Book"

@Entity()
export class Library {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Book, (book) => book.library)
    books: Book[]
}
