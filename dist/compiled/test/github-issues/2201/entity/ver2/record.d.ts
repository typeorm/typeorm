import { BaseEntity } from "../../../../../src/repository/BaseEntity";
import { RecordContext } from "./context";
export declare class Record extends BaseEntity {
    id: string;
    contexts: RecordContext[];
    status: "pending" | "failed" | "done";
}
