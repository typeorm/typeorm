import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity("sample21_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author, {
        cascade: true
    })
    posts: Post[];

}
