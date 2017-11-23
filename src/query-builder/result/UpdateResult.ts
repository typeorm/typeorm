import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 * Result object returned by UpdateQueryBuilder execution.
 */
export class UpdateResult {

    /**
     * Raw SQL result returned by executed query.
     */
    raw: any;

    /**
     * Contains inserted entity id.
     * Has entity-like structure (not just column database name and values).
     */
    // identifier: ObjectLiteral[] = [];

    /**
     * Generated values returned by a database.
     * Has entity-like structure (not just column database name and values).
     */
    generatedMaps: ObjectLiteral[] = [];

}