import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    name: string;
    posts: Post[];
    images: Image[];
    imageIds: number[];
    postIds: number[];
}
