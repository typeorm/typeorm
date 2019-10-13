import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    isRemoved: boolean;
    categories: Category[];
    subcategories: Category[];
    categoryIds: number[];
    removedCategoryIds: number[];
    subcategoryIds: number[];
    removedSubcategoryIds: number[];
}
