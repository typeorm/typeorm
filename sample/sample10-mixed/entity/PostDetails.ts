import {Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from "../../../src/index";
import {Post} from "./Post";
import {Chapter} from "./Chapter";
import {Category} from "./Category";

@Entity("sample10_post_details")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOne(type => Post, post => post.details)
    post: Post;

    @OneToMany(type => Category, category => category.details, {
        cascade: ["insert"]
    })
    categories: Category[];

    @ManyToOne(type => Chapter, chapter => chapter.postDetails, {
        cascade: ["insert"]
    })
    chapter: Chapter;

}