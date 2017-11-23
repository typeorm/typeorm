import {Column, Entity} from "../../../src/index";
import {BasePost} from "./BasePost";
import {PostCategory} from "./PostCategory";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Entity("sample6_post")
export class Post extends BasePost {

    @Column()
    text: string;

    @ManyToOne(type => PostAuthor, post => post.posts, {
        cascade: true
    })
    author: PostAuthor;

    @ManyToMany(type => PostCategory, category => category.posts, {
        cascade: true
    })
    @JoinTable()
    categories: PostCategory[] = [];

}