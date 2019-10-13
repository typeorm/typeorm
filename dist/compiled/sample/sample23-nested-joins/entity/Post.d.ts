import { Category } from "./Category";
import { Author } from "./Author";
export declare class Post {
    id: number;
    title: string;
    text: string;
    categories: Category[];
    author: Author | null;
}
