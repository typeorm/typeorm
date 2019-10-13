import { Category } from "./Category";
export declare class Post {
    id: number;
    authorId: number;
    title: string;
    categories: Category[];
    categoryIds: number[];
}
