import { ObjectID } from "../../../../../../src/driver/mongodb/typings";
import { Information } from "./Information";
export declare class Post {
    id: ObjectID;
    title: string;
    name: string;
    info: Information;
}
