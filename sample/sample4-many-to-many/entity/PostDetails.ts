import {PrimaryGeneratedColumn, Column, Entity, ManyToMany} from "../../../src/index";
import {Post} from "./Post";

@Entity("sample4_post_details")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true
    })
    authorName: string|null;

    @Column({
        nullable: true
    })
    comment: string|null;

    @Column({
        nullable: true
    })
    metadata: string|null;
    
    @ManyToMany(type => Post, post => post.details, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    posts: Post[];

}