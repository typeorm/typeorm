import { Column, Entity, Index } from "@typeorm/core";
import { BasePost } from "./BasePost";

@Entity("sample16_post")
@Index("my_index_with_id_and_title", (post: Post) => [post.id, post.title])
export class Post extends BasePost {

    @Column()
    @Index()
    title: string;

    @Column({unique: true})
    text: string;

    @Column()
    @Index()
    likesCount: number;

}
