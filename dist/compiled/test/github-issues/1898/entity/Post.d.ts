import { BaseEntity } from "../../../../src";
export declare class Post extends BaseEntity {
    id: number;
    type: string;
    token: string;
    values: Object;
    createdAt: Date;
    updatedAt: Date;
}
