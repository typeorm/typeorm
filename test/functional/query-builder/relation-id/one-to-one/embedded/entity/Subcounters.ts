import { Column, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @OneToOne(type => User)
    @JoinColumn()
    watchedUser: User;

    watchedUserId: number;

}
