import { PostCategory } from "./PostCategory";
import { BaseObject } from "./BaseObject";
export declare class Post extends BaseObject {
    text: string;
    categories: PostCategory[];
}
