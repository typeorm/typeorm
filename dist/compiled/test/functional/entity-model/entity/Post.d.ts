import { BaseEntity } from "../../../../src/repository/BaseEntity";
import { Category } from "./Category";
export declare class Post extends BaseEntity {
    id: number;
    title: string;
    text: string;
    categories: Category[];
}
