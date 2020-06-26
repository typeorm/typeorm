import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "@typeorm/core";
import { BasePost } from "./BasePost";
import { PostAuthor } from "./PostAuthor";
import { PostCategory } from "./PostCategory";

@Entity("sample6_blog")
export class Blog extends BasePost {

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
