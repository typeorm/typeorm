import { User } from "./User";
import { Category } from "./Category";
import { Tag } from "./Tag";
import { Image } from "./Image";
export declare class Post {
    id: number;
    title: string;
    tag: Tag;
    author: User;
    categories: Category[];
    subcategories: Category[];
    removedCategories: Category[];
    images: Image[];
}
