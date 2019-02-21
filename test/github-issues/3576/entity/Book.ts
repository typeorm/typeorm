import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "../../../../src";
import { User } from "./User";

@Entity()
export class Book {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @ManyToOne(type => User, user => user.books, { lazy: true })
    author: User;
}
