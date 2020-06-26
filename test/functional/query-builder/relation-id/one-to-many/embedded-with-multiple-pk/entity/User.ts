import { Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.subcounters.watchedUsers)
    post: Post;

}
