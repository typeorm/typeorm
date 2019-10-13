import { PhotoMetadata } from "./PhotoMetadata";
import { Author } from "./Author";
export declare class Photo {
    id: number;
    name: string;
    description: string;
    filename: string;
    isPublished: boolean;
    author: Author;
    metadata: PhotoMetadata;
}
