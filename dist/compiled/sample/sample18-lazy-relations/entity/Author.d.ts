import { Post } from "./Post";
export declare class Author {
    id: number;
    name: string;
    posts: Promise<Post[]>;
    /**
     * You can add this helper method.
     */
    asPromise(): Promise<this>;
}
