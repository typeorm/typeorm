import { PrimaryGeneratedColumn, ManyToMany, Entity } from "typeorm"
import { Author } from "./Author"

@Entity("book")
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToMany(() => Author, (author) => author.books, {
        onDelete: "NO ACTION",
        onUpdate: "CASCADE",
    })
    authors: Author[]
}
