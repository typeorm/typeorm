import { Category } from "./Category";
export declare class Post {
    id: string;
    title: string;
    isRemoved: boolean;
    categories: Category[];
    categoryCount: number;
    removedCategoryCount: number;
}
