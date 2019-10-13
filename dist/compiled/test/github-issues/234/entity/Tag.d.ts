import { Post } from "./Post";
export declare class Tag {
    id: number;
    name: string;
    posts: Promise<Post[]>;
}
