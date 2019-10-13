import { Post } from "./Post";
import { ImageDetails } from "./ImageDetails";
export declare class Image {
    id: number;
    name: string;
    post: Post;
    secondaryPost: Post;
    details: ImageDetails;
}
