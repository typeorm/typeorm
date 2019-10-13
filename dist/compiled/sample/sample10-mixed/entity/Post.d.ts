import { Image } from "./Image";
import { Cover } from "./Cover";
import { Category } from "./Category";
import { PostDetails } from "./PostDetails";
export declare class Post {
    id: number;
    title: string;
    text: string;
    details: PostDetails;
    images: Image[];
    secondaryImages: Image[];
    cover: Cover;
    coverId: number;
    categories: Category[];
}
