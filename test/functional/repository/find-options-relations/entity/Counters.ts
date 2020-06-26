import { Column, ManyToOne } from "@typeorm/core";
import { User } from "./User";

export class Counters {

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @ManyToOne(type => User)
    author: User;

}
