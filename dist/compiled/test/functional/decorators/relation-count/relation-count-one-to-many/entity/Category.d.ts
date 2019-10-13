import { Image } from "./Image";
import { Post } from "./Post";
export declare class Category {
    id: number;
    name: string;
    isRemoved: boolean;
    post: Post;
    images: Image[];
    imageCount: number;
    removedImageCount: number;
}
