import { EventMember } from "./EventMember";
import { Person } from "./Person";
export declare class Event {
    id: number;
    name: string;
    author: Person;
    members: EventMember[];
}
