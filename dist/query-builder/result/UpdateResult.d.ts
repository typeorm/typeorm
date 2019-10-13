import { ObjectLiteral } from "../../common/ObjectLiteral";
/**
 * Result object returned by UpdateQueryBuilder execution.
 */
export declare class UpdateResult {
    /**
     * Raw SQL result returned by executed query.
     */
    raw: any;
    /**
     * Number of affected rows/documents
     * Not all drivers support this
     */
    affected?: number;
    /**
     * Contains inserted entity id.
     * Has entity-like structure (not just column database name and values).
     */
    /**
     * Generated values returned by a database.
     * Has entity-like structure (not just column database name and values).
     */
    generatedMaps: ObjectLiteral[];
}
