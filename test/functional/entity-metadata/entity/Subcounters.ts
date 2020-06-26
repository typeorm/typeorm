import { Column, JoinTable, ManyToMany } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User)
    @JoinTable({name: "post_cnt_subcnt_wtch_users"})
    watchedUsers: User[];

}
