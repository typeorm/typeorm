import { Author } from "./Author";
import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    text: string;
    authorId: number;
    categories: Category[];
    superCategories: Category[];
    author: Author;
}
