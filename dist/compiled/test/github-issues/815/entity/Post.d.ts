import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    categories: Category[];
    categoryIds: {
        firstId: number;
        secondId: number;
    }[];
    manyCategories: Category[];
    manyCategoryIds: {
        firstId: number;
        secondId: number;
    }[];
}
