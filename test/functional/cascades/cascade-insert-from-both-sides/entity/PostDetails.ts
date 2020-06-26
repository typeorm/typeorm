import { Entity, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

    @OneToOne(type => Post, post => post.details, {
        cascade: ["insert"]
    })
    post: Post;

}
