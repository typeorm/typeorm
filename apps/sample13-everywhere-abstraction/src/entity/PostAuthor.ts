import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";
import { PostUser } from "./PostUser";

@Entity("sample13_post_author")
export class PostAuthor extends PostUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author)
    posts: Post[];

}
