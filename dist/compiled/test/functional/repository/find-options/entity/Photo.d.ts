import { Category } from "./Category";
export declare class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    views: number;
    isPublished: boolean;
    categories: Category[];
}
