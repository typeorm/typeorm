import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import { PostAuthor } from './PostAuthor';

@Entity("sample2_post_details")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;

    @OneToOne(() => Post, post => post.details, {
        cascade: true
    })
    post: Post | number | any;

}
