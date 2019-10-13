import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    categories: Promise<Category[]>;
}
