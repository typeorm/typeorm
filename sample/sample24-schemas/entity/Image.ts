import {Post} from "./Post";

export interface Image {

    id?: number;
    name: string;
    url: string;
    post?: Post;
    secondaryPost?: Post;

}