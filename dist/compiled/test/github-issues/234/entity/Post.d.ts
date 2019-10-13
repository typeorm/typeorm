import { Category } from "./Category";
import { Tag } from "./Tag";
export declare class Post {
    id: number;
    title: string;
    category: Promise<Category>;
    tags: Promise<Tag[]>;
}
