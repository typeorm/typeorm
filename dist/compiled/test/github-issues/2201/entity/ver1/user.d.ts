import { BaseEntity } from "../../../../../src/repository/BaseEntity";
import { RecordContext } from "./context";
export declare class User extends BaseEntity {
    id: string;
    contexts: RecordContext[];
}
