import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";

@Entity("sample5_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => PostAuthor, post => post.posts, {
        cascade: true
    })
    author: PostAuthor;

    @ManyToMany(type => PostCategory, category => category.posts, {
        cascade: true
    })
    @JoinTable()
    categories: PostCategory[] = [];

}
