import {PrimaryGeneratedColumn, Column, Entity, OneToOne} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample2_post_details")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "auth_nam"})
    authorName: string;

    @Column({name: "cmnt"})
    comment: string;

    @Column()
    metadata: string;
    
    @OneToOne(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    post: Post;

}