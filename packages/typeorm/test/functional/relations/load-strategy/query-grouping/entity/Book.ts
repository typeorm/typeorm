import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Isbn } from "./Isbn"
import { Library } from "./Library"
import { Tag } from "./Tag"

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Library, (library) => library.books, { nullable: true })
    library: Library | null

    @ManyToMany(() => Tag, (tag) => tag.books)
    @JoinTable()
    tags: Tag[]

    @OneToOne(() => Isbn, (isbn) => isbn.book, { nullable: true })
    @JoinColumn()
    isbn: Isbn | null
}
