import { Entity, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToMany(type => Post, post => post.counters.subcntrs.watchedUsers)
    posts: Post[];

    postIds: number[];

}
