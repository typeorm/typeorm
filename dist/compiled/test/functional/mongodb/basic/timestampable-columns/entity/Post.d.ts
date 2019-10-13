import { ObjectID } from "../../../../../../src/driver/mongodb/typings";
export declare class Post {
    id: ObjectID;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}
