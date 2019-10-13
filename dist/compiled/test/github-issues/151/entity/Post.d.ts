import { Category } from "./Category";
import { PostMetadata } from "./PostMetadata";
export declare class Post {
    id: number;
    title: string;
    category: Category | null;
    metadata: PostMetadata | null;
}
