import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Book } from "./Book";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @OneToMany(type => Book, book => book.author, { lazy: true })
    books: Book[];
}
