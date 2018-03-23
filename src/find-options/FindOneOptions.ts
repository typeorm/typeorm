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
    where?: Partial<Entity>|ObjectLiteral|string;

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
    order?: { [P in keyof Entity]?: "ASC"|"DESC"|1|-1 };

    /**
     * Enables or disables query result caching.
     */
    cache?: boolean | number | { id: any, milliseconds: number };

}
