import { Person } from "./person";
export declare class Note {
    id: number;
    label: string;
    owner: Promise<Person> | Person;
}
