import { PostDetails } from "./PostDetails";
import { PostCategory } from "./PostCategory";
import { PostAuthor } from "./PostAuthor";
import { PostInformation } from "./PostInformation";
import { PostImage } from "./PostImage";
import { PostMetadata } from "./PostMetadata";
export declare class Post {
    id: number;
    title: string;
    text: string;
    categories: PostCategory[];
    details: PostDetails[];
    images: PostImage[];
    metadatas: PostMetadata[];
    informations: PostInformation[];
    authors: PostAuthor[];
}
