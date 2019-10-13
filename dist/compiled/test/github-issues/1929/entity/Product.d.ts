import { ObjectID } from "../../../../src";
export declare class Product {
    constructor(name: string, label: string, price: number);
    id: ObjectID;
    name: string;
    label: string;
    price: number;
}
