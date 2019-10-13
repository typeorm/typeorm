import { Counters } from "./Counters";
export declare class Post {
    id: number;
    title: string;
    text: string;
    counters: Counters;
    otherCounters: Counters;
    countersWithoutPrefix: Counters;
}
