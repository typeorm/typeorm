import type { DeferrableType } from "../../metadata/types/DeferrableType"
import type { OnDeleteType } from "../../metadata/types/OnDeleteType"
import type { OnUpdateType } from "../../metadata/types/OnUpdateType"

/**
 * Describes relation options shared by all relation types.
 */
export interface RelationOptions {
    /**
     * Sets cascades options for the given relation.
     * If set to true then it means that related object can be allowed to be inserted or updated in the database.
     * You can separately restrict cascades to insertion or updation using following syntax:
     *
     * @example
     * cascade: ["insert", "update", "remove", "soft-remove", "recover"] // include or exclude one of them
     *
     */
    cascade?:
        | boolean
        | ("insert" | "update" | "remove" | "soft-remove" | "recover")[]

    /**
     * Indicates if relation column value can be nullable or not.
     */
    nullable?: boolean

    /**
     * Database cascade action on delete.
     */
    onDelete?: OnDeleteType

    /**
     * Database cascade action on update.
     */
    onUpdate?: OnUpdateType

    /**
     * Indicate if foreign key constraints can be deferred.
     */
    deferrable?: DeferrableType

    /**
     * Indicates whether foreign key constraints will be created for join columns.
     * Can be used only for many-to-one and owner one-to-one relations.
     * Defaults to true.
     */
    createForeignKeyConstraints?: boolean

    /**
     * Set this relation to be lazy. Note: lazy relations are promises. When you call them they return promise
     * which resolve relation result then. If your property's type is Promise then this relation is set to lazy automatically.
     */
    lazy?: boolean

    /**
     * Set this relation to be eager.
     * Eager relations are always loaded automatically when relation's owner entity is loaded using find* methods.
     * Only using QueryBuilder prevents loading eager relations.
     * Eager flag cannot be set from both sides of relation - you can eager load only one side of the relationship.
     */
    eager?: boolean

    /**
     * Indicates if persistence is enabled for the relation.
     * By default its enabled, but if you want to avoid any changes in the relation to be reflected in the database you can disable it.
     * If its disabled you can only change a relation from inverse side of a relation or using relation query builder functionality.
     * This is useful for performance optimization since its disabling avoid multiple extra queries during entity save.
     */
    persistence?: boolean
}

/**
 * Options for `@OneToMany` relations.
 * Extends base options with orphaned row handling.
 */
export interface OneToManyRelationOptions extends RelationOptions {
    /**
     * When a parent is saved without a child that still exists in database,
     * this controls what happens to the orphaned rows.
     *
     * - `"nullify"` — sets the foreign key to null (deletes if FK is non-nullable)
     * - `"delete"` — removes the orphaned row from the database
     * - `"soft-delete"` — marks the orphaned row as soft-deleted
     * - `"disable"` — skips orphan handling entirely (will be removed in the next major — see #12343)
     *
     * When left unset, TypeORM currently defaults to `"nullify"` for backward
     * compatibility and logs a deprecation warning on first use. In the next
     * major version the default will change to no action. See #12343.
     */
    orphans?: "nullify" | "delete" | "soft-delete" | "disable"
}
