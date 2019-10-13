import { Photo } from "./Photo";
export declare class PhotoMetadata {
    id: number;
    height: number;
    width: number;
    orientation: string;
    compressed: boolean;
    comment: string;
    photo: Photo;
}
