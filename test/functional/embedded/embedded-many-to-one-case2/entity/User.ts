import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    @JoinColumn()
    likedPost: Post;

}
