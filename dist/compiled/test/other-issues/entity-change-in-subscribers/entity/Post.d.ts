import { PostCategory } from "./PostCategory";
export declare class Post {
    id: number;
    title: string;
    active: boolean;
    updateDate: Date;
    category: PostCategory;
    updatedColumns: number;
    updatedRelations: number;
}
