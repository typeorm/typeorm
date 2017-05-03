import {PrimaryGeneratedColumn, Column, Entity, OneToMany} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample3_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "desc"})
    description: string;

    @OneToMany(type => Post, post => post.metadata)
    posts: Post[];

}