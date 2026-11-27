import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Author, (author) => author.books)
    author: Author
}
