import { Category } from "./Category";
import { PostCategory } from "./PostCategory";
export declare class Post {
    id: number;
    title: string;
    categoryByName: Category;
    category: Category;
    categories: PostCategory[];
    categoryId: number;
    categoryName: string;
}
