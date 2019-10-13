import { Post } from "./Post";
import { CategoryMetadata } from "./CategoryMetadata";
export declare class Category {
    id: number;
    posts: Post[];
    metadataId: number;
    metadata: CategoryMetadata;
    name: string;
}
