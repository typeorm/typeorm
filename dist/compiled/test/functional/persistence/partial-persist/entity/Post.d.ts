import { Category } from "./Category";
import { Counters } from "./Counters";
export declare class Post {
    id: number;
    title: string;
    description: string;
    counters: Counters;
    categories: Category[];
}
