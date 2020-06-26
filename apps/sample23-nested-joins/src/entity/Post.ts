import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Author } from "./Author";

@Entity("sample23_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category, {
        cascade: true
    })
    @JoinTable()
    categories: Category[];

    @ManyToOne(type => Author, {cascade: ["insert"]})
    author: Author | null;

}
