import { Category } from "./Category";
import { Details } from "./Details";
import { Photo } from "./Photo";
export declare class Post {
    id: number;
    title: string;
    category: Category;
    details: Details;
    photo: Photo;
}
