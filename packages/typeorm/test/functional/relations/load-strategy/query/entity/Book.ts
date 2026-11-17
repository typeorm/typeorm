import {
    Column,
    Entity,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Author } from "./Author"
import { Comment } from "./Comment"
import { Translation } from "./Translation"

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany(() => Author, (author) => author.books)
    author?: Author[]

    @OneToMany(() => Comment, (comment) => comment.book, { eager: true })
    comments?: Comment[]

    @OneToMany(() => Translation, (translation) => translation.book)
    translations?: Translation[]
}
