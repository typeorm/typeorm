import {  Entity, PrimaryGeneratedColumn, OneToMany } from "../../../../src"
import { Post } from "./post"

@Entity()
export class User {
    @PrimaryGeneratedColumn("increment")
    id!: number

    @OneToMany(() => Post, (posts: Post) => posts.author)
    posts!: Post[];

    postCount?: number; // Does not map to a column
}
