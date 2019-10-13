import { Photo } from "./Photo";
export declare class User {
    id: number;
    name: string;
    someDate: Date;
    oneToOnePhoto: Photo;
    oneToManyPhotos: Photo[];
    manyToOnePhoto: Photo;
    manyToManyPhotos: Photo[];
    treeParentPhoto: Photo;
}
