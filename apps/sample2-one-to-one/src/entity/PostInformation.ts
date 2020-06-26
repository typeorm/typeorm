import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "@typeorm/core";
import {Post} from "./Post";
import { PostAuthor } from './PostAuthor';

@Entity("sample2_post_information")
export class PostInformation {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @OneToOne(() => Post, post => post.information, {
        cascade: ["update"]
    })
    post: Post | number | any;

}
