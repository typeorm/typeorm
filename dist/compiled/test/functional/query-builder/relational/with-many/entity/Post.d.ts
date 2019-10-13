import { Category } from "./Category";
import { Image } from "./Image";
export declare class Post {
    id: number;
    title: string;
    category: Category;
    images: Image[];
}
