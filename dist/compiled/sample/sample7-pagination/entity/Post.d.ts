import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";
export declare class Post {
    id: number;
    title: string;
    text: string;
    author: PostAuthor;
    categories: PostCategory[];
}
