import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    code: number;
    name: string;
    isRemoved: boolean;
    post: Post;
    images: Image[];
    postId: number;
    imageIds: number[];
}
