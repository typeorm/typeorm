import { Category } from "./Category";
import { User } from "./User";
import { Photo } from "./Photo";
import { Counters } from "./Counters";
export declare class Post {
    id: number;
    title: string;
    photos: Photo[];
    user: User;
    categories: Category[];
    counters: Counters;
}
