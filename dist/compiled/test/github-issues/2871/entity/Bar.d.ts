import { BaseEntity } from "../../../../src";
import { DocumentEnum } from "../documentEnum";
export declare class Bar extends BaseEntity {
    barId: number;
    documents: DocumentEnum[];
}
