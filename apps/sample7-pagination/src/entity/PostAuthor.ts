import {Column, Entity, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import {OneToMany} from "@typeorm/core";

@Entity("sample7_post_author")
export class PostAuthor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}
