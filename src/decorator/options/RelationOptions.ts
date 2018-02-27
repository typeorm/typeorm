import {OnDeleteType} from "../../metadata/types/OnDeleteType";
import { OrphanedRowAction } from "./OrphanedRowAction";

// todo: add ON_UPDATE

/**
 * Describes all relation's options.
 */
export interface RelationOptions {

    /**
     * If set to true then it means that related object can be allowed to be inserted / updated / removed to the db.
     * This is option a shortcut if you would like to set cascadeInsert, cascadeUpdate and cascadeRemove to true.
     */
    cascadeAll?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    cascadeInsert?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    cascadeUpdate?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    cascadeRemove?: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    nullable?: boolean;

    /**
     * Database cascade action on delete.
     */
    onDelete?: OnDeleteType;

    /**
     * Indicates if this relation will be a primary key.
     * Can be used only for many-to-one and owner one-to-one relations.
     */
    primary?: boolean;

    /**
     * Set this relation to be lazy. Note: lazy relations are promises. When you call them they return promise
     * which resolve relation result then. If your property's type is Promise then this relation is set to lazy automatically.
     */
    lazy?: boolean;

    /**
     * Set this relation to be eager.
     * Eager relations are always loaded automatically when relation's owner entity is loaded using find* methods.
     * Only using QueryBuilder prevents loading eager relations.
     * Eager flag cannot be set from both sides of relation - you can eager load only one side of the relationship.
     */
    eager?: boolean;

    /**
     * When a child row is removed from its parent, determines if the child row should be orphaned (default) or deleted.
     */
    orphanedRowAction?: OrphanedRowAction;

}