import { BaseEntity } from "../../../../src";
import { Foo } from "./Foo";
export declare class Bar extends BaseEntity {
    id: number;
    description: string;
    foos?: Foo[];
}
