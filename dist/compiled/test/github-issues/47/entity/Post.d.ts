import { Category } from "./Category";
export declare class Post {
    id: number;
    title: string;
    category: Promise<Category>;
}
