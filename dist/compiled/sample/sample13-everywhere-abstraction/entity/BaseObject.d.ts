import { BasePost } from "./BasePost";
import { PostAuthor } from "./PostAuthor";
export declare class BaseObject extends BasePost {
    id: number;
    title: string;
    author: PostAuthor;
}
