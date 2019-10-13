import { Post } from "./Post";
import { Image } from "./Image";
export declare class Category {
    id: number;
    code: number;
    name: string;
    isRemoved: boolean;
    post: Post;
    image: Image;
    postId: number;
    imageId: number;
}
