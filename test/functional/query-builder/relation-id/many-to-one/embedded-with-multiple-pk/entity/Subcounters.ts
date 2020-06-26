import { Column, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @ManyToOne(type => User)
    watchedUser: User;

    watchedUserId: number;

}
