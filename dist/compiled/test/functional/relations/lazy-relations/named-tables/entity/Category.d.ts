import { Post } from "./Post";
export declare class Category {
    id: number;
    name: string;
    onePost: Promise<Post>;
    twoSidePosts: Promise<Post[]>;
    twoSidePosts2: Promise<Post[]>;
    postsNamedTable: Promise<Post[]>;
    onePostsNamedTable: Promise<Post[]>;
    onePostNamedTable: Promise<Post>;
}
