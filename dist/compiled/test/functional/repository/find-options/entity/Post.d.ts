import { Category } from "./Category";
import { User } from "./User";
export declare class Post {
    id: number;
    title: string;
    author: User;
    categories: Category[];
}
