import { Post } from "./Post";
export declare class Category {
    id: number;
    name: string;
    post?: Post | null | number;
    constructor(id: number, name: string, post?: Post);
}
