import { Post } from "./Post";
import { Tag } from "./Tag";
export declare class Category {
    name: string;
    type: string;
    code: number;
    version: number;
    description: string;
    posts: Post[];
    postsWithOptions: Post[];
    postsWithNonPKColumns: Post[];
    tags: Tag[];
    tagsWithOptions: Tag[];
    tagsWithNonPKColumns: Tag[];
}
