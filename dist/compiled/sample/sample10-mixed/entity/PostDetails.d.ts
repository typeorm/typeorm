import { Post } from "./Post";
import { Chapter } from "./Chapter";
import { Category } from "./Category";
export declare class PostDetails {
    id: number;
    meta: string;
    comment: string;
    post: Post;
    categories: Category[];
    chapter: Chapter;
}
