import {
    FindOptionsRelationByString,
    FindOptionsRelations,
} from "./FindOptionsRelations"

/**
 * Defines a special criteria to find specific entities.
 */
export interface FindTreeOptions<Entity = any> {
    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: FindOptionsRelations<Entity> | FindOptionsRelationByString

    /**
     * When loading a tree from a TreeRepository, limits the depth of the descendents loaded
     */
    depth?: number
}
