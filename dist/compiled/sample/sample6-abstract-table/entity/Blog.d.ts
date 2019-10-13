import { BasePost } from "./BasePost";
import { PostAuthor } from "./PostAuthor";
import { PostCategory } from "./PostCategory";
export declare class Blog extends BasePost {
    text: string;
    author: PostAuthor;
    categories: PostCategory[];
}
