import {ObjectUtils} from "../../util/ObjectUtils";

export class RelationSeparateAttributes {

    /**
     * Path of relation. e.g. "post.category" for User entity
     */
    relationPath: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(relationSeparateAttribute?: Partial<RelationSeparateAttributes>) {
        ObjectUtils.assign(this, relationSeparateAttribute || {});
    }
}
