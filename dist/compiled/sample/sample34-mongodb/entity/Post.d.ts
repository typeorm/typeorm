import { ObjectID } from "../../../src/driver/mongodb/typings";
export declare class Post {
    id: ObjectID;
    title: string;
    text: string;
    likesCount: number;
}
