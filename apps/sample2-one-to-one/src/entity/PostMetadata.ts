import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import { PostAuthor } from './PostAuthor';

@Entity("sample2_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @OneToOne(() => Post, post => post.metadata)
    post: Post | number | any;

}
