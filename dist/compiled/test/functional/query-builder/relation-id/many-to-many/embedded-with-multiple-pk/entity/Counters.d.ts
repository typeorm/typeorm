import { Category } from "./Category";
import { Subcounters } from "./Subcounters";
export declare class Counters {
    code: number;
    likes: number;
    comments: number;
    favorites: number;
    categories: Category[];
    subcntrs: Subcounters;
    categoryIds: number[];
}
