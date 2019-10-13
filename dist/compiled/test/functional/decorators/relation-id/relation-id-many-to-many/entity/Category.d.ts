import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    name: string;
    isRemoved: boolean;
    posts: Post[];
    images: Image[];
    imageIds: number[];
    removedImageIds: number[];
    postIds: number[];
    removedPostIds: number[];
}
