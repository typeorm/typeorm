import { ObjectID } from "../../../../src/driver/mongodb/typings";
import { Event } from "./Event";
export declare class User {
    id: ObjectID;
    firstName: string;
    lastName: string;
    age: number;
    events: Event[];
}
