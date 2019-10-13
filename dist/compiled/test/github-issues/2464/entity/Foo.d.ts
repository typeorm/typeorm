import { BaseEntity } from "../../../../src";
import { Bar } from "./Bar";
export declare class Foo extends BaseEntity {
    id: number;
    bars?: Bar[];
    otherBars?: Bar[];
}
