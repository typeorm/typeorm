import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";
import { Counters } from "./Counters";
import { User } from "./User";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    filename: string;

    @ManyToOne(type => User)
    user: User;

    @ManyToOne(type => Post, post => post.photos)
    post: Post;

    @Column(type => Counters)
    counters: Counters;

}
