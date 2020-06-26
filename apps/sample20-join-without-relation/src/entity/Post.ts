import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Author } from "./Author";
import { Category } from "./Category";

@Entity("sample20_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int")
    authorId: number;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    superCategories: Category[];

    author: Author;

}
