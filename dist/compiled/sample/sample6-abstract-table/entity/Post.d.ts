import { BasePost } from "./BasePost";
import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";
export declare class Post extends BasePost {
    text: string;
    author: PostAuthor;
    categories: PostCategory[];
}
