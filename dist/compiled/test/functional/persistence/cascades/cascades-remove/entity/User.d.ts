import { Photo } from "./Photo";
export declare class User {
    id: number;
    name: string;
    manyPhotos: Photo[];
    manyToManyPhotos: Photo[];
}
