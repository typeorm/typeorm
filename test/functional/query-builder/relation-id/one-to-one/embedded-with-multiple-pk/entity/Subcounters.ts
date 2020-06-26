import { Column, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @OneToOne(type => User)
    @JoinColumn()
    watchedUser: User;

    watchedUserId: number;

}
