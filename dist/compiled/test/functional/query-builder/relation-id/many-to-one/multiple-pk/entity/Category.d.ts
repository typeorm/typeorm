import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    code: number;
    name: string;
    isRemoved: boolean;
    posts: Post[];
    image: Image;
    postIds: number[];
    imageId: number[];
}
