import { Post } from "./Post";
import { Counters } from "./Counters";
import { User } from "./User";
export declare class Photo {
    id: number;
    filename: string;
    user: User;
    post: Post;
    counters: Counters;
}
