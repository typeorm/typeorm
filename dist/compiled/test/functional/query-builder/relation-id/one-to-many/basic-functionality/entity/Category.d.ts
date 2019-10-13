import { Image } from "./Image";
import { Post } from "./Post";
export declare class Category {
    id: number;
    name: string;
    isRemoved: boolean;
    images: Image[];
    imageIds: number[];
    post: Post;
    postId: number;
}
