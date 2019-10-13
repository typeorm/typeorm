import { BaseEntity } from "../../../../src/repository/BaseEntity";
import { Foo } from "./Foo";
export declare class Bar extends BaseEntity {
    id: number;
    foo: Foo;
}
