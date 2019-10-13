import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    category: Category;
    categoryWithOptions: Category;
    categoryWithNonPKColumns: Category;
}
