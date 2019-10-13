import { Category } from "./Category";
export declare class Post {
    id: number;
    authorId: number;
    title: string;
    isRemoved: boolean;
    categories: Category[];
    subcategories: Category[];
    categoryIds: number[];
}
