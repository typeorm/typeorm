import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "@typeorm/core";
import { BasePost } from "./BasePost";
import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";

@Entity("sample6_post")
export class Post extends BasePost {

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
