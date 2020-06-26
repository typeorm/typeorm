import { Column, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User, user => user.posts)
    @JoinTable({name: "subcnt_users"})
    watchedUsers: User[];

    watchedUserIds: number[];

}
