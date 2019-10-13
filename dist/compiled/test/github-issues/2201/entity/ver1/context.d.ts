import { BaseEntity } from "../../../../../src/repository/BaseEntity";
import { User } from "./user";
import { Record } from "./record";
export declare class RecordContext extends BaseEntity {
    recordId: string;
    userId: string;
    readonly record: Record;
    readonly user: User;
    readonly meta: any;
}
