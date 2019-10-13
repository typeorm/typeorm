import { Counters } from "./Counters";
import { ObjectID } from "../../../../../../src/driver/mongodb/typings";
export declare class Post {
    id: ObjectID;
    title: string;
    counters: Counters[];
    names: string[];
    numbers: number[];
    booleans: boolean[];
    other1: Counters[];
    other2: Counters[];
}
