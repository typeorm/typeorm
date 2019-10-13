import { Category } from "./Category";
export declare class Tag {
    code: number;
    title: string;
    description: string;
    category: Category;
    categoryWithOptions: Category;
    categoryWithNonPKColumns: Category;
}
