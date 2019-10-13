import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    text: string;
    categories: Category[];
    constructor(title: string, text: string, categories: Category[]);
}
