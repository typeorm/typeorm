import { ObjectID } from "../../../../src";
export declare class Page {
    number: number;
}
export declare class Chapter {
    title: string;
    pages: Page[];
}
export declare class Book {
    id: ObjectID;
    title: string;
    chapters: Chapter[];
}
