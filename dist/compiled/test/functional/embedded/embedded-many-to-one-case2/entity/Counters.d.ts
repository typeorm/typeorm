import { User } from "./User";
import { Subcounters } from "./Subcounters";
export declare class Counters {
    code: number;
    likes: number;
    comments: number;
    favorites: number;
    subcounters: Subcounters;
    likedUsers: User[];
}
