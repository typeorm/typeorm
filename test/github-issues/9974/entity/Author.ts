import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "../../../../src";
import {Post} from "./Post";
import {PostWithCascade} from "./PostWithCascade";

@Entity()
export class Author{
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Post, post => post.authors)
    @JoinTable()
    posts: Post[]

    @ManyToMany(() => PostWithCascade, postWithCascade => postWithCascade.authors)
    @JoinTable()
    postsWithCascade: PostWithCascade[]
}
