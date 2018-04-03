import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class PostCategory {

    @ManyToOne(type => Post, post => post.categories, {
        primary: true,
        cascadeInsert: true
    })
    post: Post;

    @ManyToOne(type => Category, category => category.posts, {
        primary: true,
        cascadeInsert: true
    })
    category: Category;

    @Column()
    addedByAdmin: boolean;

    @Column()
    addedByUser: boolean;

}