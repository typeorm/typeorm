import { Column, Entity, JoinTable, ManyToMany } from "@typeorm/core";
import { PostCategory } from "./PostCategory";
import { BaseObject } from "./BaseObject";

@Entity("sample13_blog")
export class Blog extends BaseObject {

    @Column()
    text: string;

    @ManyToMany(type => PostCategory, category => category.posts, {
        cascade: true
    })
    @JoinTable()
    categories: PostCategory[] = [];

}
