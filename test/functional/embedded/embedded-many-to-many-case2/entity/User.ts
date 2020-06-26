import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.counters.likedUsers)
    @JoinTable()
    likedPosts: Post[];

}
