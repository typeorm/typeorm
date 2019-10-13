import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    name: string;
    isRemoved: boolean;
    posts: Post[];
    images: Image[];
    postCount: number;
    removedPostCount: number;
    imageCount: number;
    removedImageCount: number;
}
