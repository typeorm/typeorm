import { Column, OneToMany } from "@typeorm/core";
import { User } from "./User";
import { Subcounters } from "./Subcounters";

export class Counters {

    @Column()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters, {prefix: "subcnt"})
    subcounters: Subcounters;

    @OneToMany(type => User, user => user.likedPost)
    likedUsers: User[];

}
