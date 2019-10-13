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
    categoriesNamedAll: Promise<Category[]>;
    categoryNamedAll: Promise<Category>;
    oneCategoryNamedAll: Promise<Category>;
}
