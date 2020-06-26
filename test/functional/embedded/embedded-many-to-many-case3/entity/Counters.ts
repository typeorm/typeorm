import { Column, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Subcounters } from "./Subcounters";
import { User } from "./User";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters, {prefix: "subcnt"})
    subcounters: Subcounters;

    @ManyToMany(type => User, user => user.likedPosts)
    @JoinTable()
    likedUsers: User[];

}
