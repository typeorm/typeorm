import { Post } from "./Post";
import { PostUser } from "./PostUser";
export declare class PostAuthor extends PostUser {
    id: number;
    name: string;
    posts: Post[];
}
