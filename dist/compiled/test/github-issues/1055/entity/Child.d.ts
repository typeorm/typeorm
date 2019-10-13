import { Parent } from "./Parent";
export declare class Child {
    id: number;
    name: string;
    parent: Promise<Parent> | Parent | number;
}
