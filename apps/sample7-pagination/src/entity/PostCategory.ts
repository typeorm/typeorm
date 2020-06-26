import {Column, Entity, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import {ManyToMany} from "@typeorm/core";

@Entity("sample7_post_category")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.categories, {
        cascade: true
    })
    posts: Post[] = [];

}
