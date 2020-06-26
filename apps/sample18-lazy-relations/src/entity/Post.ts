import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Author } from "./Author";
import { Category } from "./Category";

@Entity("sample18_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts, {
        cascade: ["insert"],
        onDelete: "SET NULL"
    })
    author: Promise<Author | null>;

    @ManyToMany(type => Category, category => category.posts, {
        cascade: true
    })
    @JoinTable()
    categories: Promise<Category[]>;

}
