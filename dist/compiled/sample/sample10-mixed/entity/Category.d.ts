import { Post } from "./Post";
import { PostDetails } from "./PostDetails";
export declare class Category {
    id: number;
    description: string;
    posts: Post[];
    details: PostDetails;
}
