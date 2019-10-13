import { PostAuthor } from "./PostAuthor";
export declare class Post {
    id: number;
    title: string;
    text: string;
    author: PostAuthor;
    editors: PostAuthor[];
    manyAuthors: PostAuthor[];
}
