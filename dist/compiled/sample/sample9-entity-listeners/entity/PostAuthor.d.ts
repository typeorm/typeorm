import { Post } from "./Post";
export declare class PostAuthor {
    id: number;
    name: string;
    posts: Post[];
    doSomethingBeforeInsertion(): void;
    doSomethingAfterInsertion(): void;
    doSomethingBeforeUpdate(): void;
    doSomethingAfterUpdate(): void;
    doSomethingBeforeRemove(): void;
    doSomethingAfterRemove(): void;
}
