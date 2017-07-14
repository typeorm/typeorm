import {JoinOptions} from "./JoinOptions";

/**
 * Defines a special criteria to find specific entity.
 */
export interface FindOneOptions<Entity> {

    /**
     * Simple condition that should be applied to match entities.
     */
    where?: Partial<Entity>;

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
    order?: { [P in keyof Entity]?: "ASC"|"DESC" };

}
