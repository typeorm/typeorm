import { Category } from "./Category";
export declare class Tag {
    code: number;
    title: string;
    description: string;
    categories: Category[];
    categoriesWithOptions: Category[];
    categoriesWithNonPKColumns: Category[];
}
