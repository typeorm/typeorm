import { Column, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { User } from "./User";

export class Subcounters {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToOne(type => User)
    watchedUser: User;

    watchedUserId: number;

}
