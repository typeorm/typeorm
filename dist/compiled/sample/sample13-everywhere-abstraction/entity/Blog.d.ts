import { PostCategory } from "./PostCategory";
import { BaseObject } from "./BaseObject";
export declare class Blog extends BaseObject {
    text: string;
    categories: PostCategory[];
}
