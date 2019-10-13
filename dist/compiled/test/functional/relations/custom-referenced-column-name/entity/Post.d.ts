import { Category } from "./Category";
import { Tag } from "./Tag";
export declare class Post {
    id: number;
    title: string;
    categoryName: string;
    categoryId: number;
    tagName: string;
    tagId: number;
    categoryWithEmptyJoinCol: Category;
    categoryWithoutRefColName: Category;
    categoryWithoutColName: Category;
    categoryWithoutRefColName2: Category;
    category: Category;
    tagWithEmptyJoinCol: Tag;
    tagWithoutRefColName: Tag;
    tagWithoutColName: Tag;
    tagWithoutRefColName2: Tag;
    tag: Tag;
}
