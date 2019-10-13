import { Category } from "./Category";
export declare class Post {
    id: number;
    authorId: number;
    title: string;
    isRemoved: boolean;
    category: Category;
    subcategory: Category;
    categoryId: number;
}
