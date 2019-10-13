import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    text: string;
    categories: Promise<Category[]>;
    twoSideCategories: Promise<Category[]>;
    viewCount: number;
    category: Promise<Category>;
    oneCategory: Promise<Category>;
    twoSideCategory: Promise<Category>;
    categoriesNamedColumn: Promise<Category[]>;
    categoryNamedColumn: Promise<Category>;
    oneCategoryNamedColumn: Promise<Category>;
}
