import { Post } from "./Post";
export declare class Category {
    firstId: number;
    secondId: number;
    name: string;
    post: Post | null;
    postId: number;
    manyPosts: Post[];
    manyPostIds: number[];
}
