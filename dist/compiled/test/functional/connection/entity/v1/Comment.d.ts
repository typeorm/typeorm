import { Guest } from "./Guest";
export declare class Comment {
    id: number;
    title: string;
    context: string;
    reference?: Comment;
    relay?: Comment;
    author: Guest;
}
