import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Category} from "./Category";
import {Image} from "./Image";

@Entity()
export class PostCategory {

    @ManyToOne(type => Post, post => post.categories, {
        primary: true
    })
    post: Post;

    @ManyToOne(type => Category, category => category.posts, {
        primary: true
    })
    category: Category;

    @ManyToOne(type => Image)
    image: Image;

    postId: number;

    categoryId: number;

    imageId: number;

}