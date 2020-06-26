import { Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    personId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.counters.likedUser)
    likedPosts: Post[];

}
