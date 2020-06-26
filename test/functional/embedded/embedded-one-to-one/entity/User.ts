import { Column, Entity, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Post, post => post.counters.likedUser)
    likedPost: Post;

}
