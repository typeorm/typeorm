import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 * Result object returned by InsertQueryBuilder execution.
 */
export class InsertResult {
    /**
     * Raw SQL result returned by executed query.
     */
    raw: any;

    /**
     * Number of affected rows/documents
     * Not all drivers support this
     */
    affected?: number|null;

    /**
     * Inserted row ID
     * Not all drivers support this
     */
    rowId: any;

    /**
     * Contains inserted entity id.
     * Has entity-like structure (not just column database name and values).
     */
    identifiers: ObjectLiteral[] = [];

    /**
     * Generated values returned by a database.
     * Has entity-like structure (not just column database name and values).
     */
    generatedMaps: ObjectLiteral[] = [];
}
