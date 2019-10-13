import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";
export declare class Post {
    id: number;
    title: string;
    text: string;
    author: PostAuthor;
    categories: PostCategory[];
    uid: number;
    generateRandomNumbers(): void;
    doSomethingBeforeInsertion(): void;
    doSomethingAfterInsertion(): void;
    doSomethingBeforeUpdate(): void;
    doSomethingAfterUpdate(): void;
    doSomethingBeforeRemove(): void;
    doSomethingAfterRemove(): void;
}
