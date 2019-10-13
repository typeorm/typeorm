import { Note } from "./note";
export declare class Person {
    id: number;
    name: string;
    notes: Promise<Note[]> | Note[];
}
