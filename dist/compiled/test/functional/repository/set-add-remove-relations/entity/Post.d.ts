import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    categories: Category[] | null;
    manyCategories: Category[];
}
