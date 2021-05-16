import {Image} from "./Image";
import {Category} from "./Category";
import {PostDetails} from "./PostDetails";

export interface Post {

    id?: number;
    title: string;
    text: string;
    details?: PostDetails;
    images?: Image[];
    secondaryImages?: Image[];
    categories?: Category[];

}