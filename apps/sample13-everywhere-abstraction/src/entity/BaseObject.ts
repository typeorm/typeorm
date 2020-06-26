import { Column, Generated, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { BasePost } from "./BasePost";
import { PostAuthor } from "./PostAuthor";

export class BaseObject extends BasePost {

    @PrimaryColumn("double")
    @Generated()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => PostAuthor, post => post.posts, {
        cascade: true
    })
    author: PostAuthor;

}
