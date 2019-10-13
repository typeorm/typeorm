import { Category } from "./Category";
import { User } from "./User";
import { Editor } from "./Editor";
export declare class Post {
    id: number;
    title: string;
    categories1: Category[];
    categories2: Category[];
    author: User;
    editors: Editor[];
}
