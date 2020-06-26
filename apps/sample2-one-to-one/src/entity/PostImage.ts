import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import { PostAuthor } from './PostAuthor';

@Entity("sample2_post_image")
export class PostImage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @OneToOne(() => Post, post => post.image)
    post: Post | number | any;

}
