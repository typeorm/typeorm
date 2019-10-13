import { BaseEntity } from "../../../../src";
export declare class Group extends BaseEntity {
    id: string;
    name: string;
    children: Group;
    parent: Group;
}
