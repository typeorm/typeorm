import { JoinOptions } from "./JoinOptions";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { FindConditions } from "./FindConditions";
/**
 * Defines a special criteria to find specific entity.
 */
export interface FindOneOptions<Entity = any> {
    /**
     * Specifies what columns should be retrieved.
     */
    select?: (keyof Entity)[];
    /**
     * Simple condition that should be applied to match entities.
     */
    where?: FindConditions<Entity>[] | FindConditions<Entity> | ObjectLiteral | string;
    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: string[];
    /**
     * Specifies what relations should be loaded.
     */
    join?: JoinOptions;
    /**
     * Order, in which entities should be ordered.
     */
    order?: {
        [P in keyof Entity]?: "ASC" | "DESC" | 1 | -1;
    };
    /**
     * Enables or disables query result caching.
     */
    cache?: boolean | number | {
        id: any;
        milliseconds: number;
    };
    /**
     * Enables or disables query result caching.
     */
    lock?: {
        mode: "optimistic";
        version: number | Date;
    } | {
        mode: "pessimistic_read" | "pessimistic_write" | "dirty_read";
    };
    /**
     * If sets to true then loads all relation ids of the entity and maps them into relation values (not relation objects).
     * If array of strings is given then loads only relation ids of the given properties.
     */
    loadRelationIds?: boolean | {
        relations?: string[];
        disableMixedMap?: boolean;
    };
    /**
     * Indicates if eager relations should be loaded or not.
     * By default they are loaded when find methods are used.
     */
    loadEagerRelations?: boolean;
}
