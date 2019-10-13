import { Child } from "./Child";
export declare class Parent {
    id: number;
    name: string;
    children: Promise<Child[]>;
}
