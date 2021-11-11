import { Post } from "./Post";
import { Entity, ManyToMany, Column, PrimaryGeneratedColumn } from "../../../../../src";

@Entity()
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => Post, (post) => post.tags)
    posts: Post[]

}
