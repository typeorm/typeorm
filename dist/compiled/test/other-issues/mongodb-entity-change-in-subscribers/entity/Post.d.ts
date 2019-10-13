import { ObjectID } from "../../../../src";
export declare class Post {
    id: ObjectID;
    title: string;
    active: boolean;
    updateDate: Date;
    updatedColumns: number | string[];
    loaded: boolean;
}
