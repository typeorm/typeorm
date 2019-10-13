import { Author } from "./Author";
import { Category } from "./Category";
import { PostMetadata } from "./PostMetadata";
export declare class Post {
    id: number;
    title: string;
    text: string;
    author: Author;
    categories: Category[];
    metadata: PostMetadata;
}
