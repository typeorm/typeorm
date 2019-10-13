import { Post } from "./Post";
import { Details } from "./Details";
import { Category } from "./Category";
export declare class Photo {
    id: number;
    name: string;
    details: Details;
    post: Post;
    category: Category;
}
