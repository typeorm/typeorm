import {JoinOptions} from "./JoinOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Defines a special criteria to find specific entity.
 */
export interface FindOneOptions<Entity> {

    /**
     * Specifies what columns should be retrieved.
     */
    select?: (keyof Entity)[];

    /**
     * Simple condition that should be applied to match entities.
     */
    where?: Partial<Entity>|ObjectLiteral;

    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: (keyof Entity)[];

    /**
     * Specifies what relations should be loaded.
     */
    join?: JoinOptions;

    /**
     * Order, in which entities should be ordered.
     */
    order?: { [P in keyof Entity]?: "ASC"|"DESC"|1|-1 };

    /**
     * Enables or disables query result caching.
     */
    cache?: boolean | number | { id: any, milliseconds: number };

    /**
     * If sets to true then loads all relation ids of the entity and maps them into relation values (not relation objects).
     * If array of strings is given then loads only relation ids of the given properties.
     */
    loadRelationIds?: boolean|{ relations?: string[], disableMixedMap?: boolean }; // todo: extract options into separate interface, reuse

}
