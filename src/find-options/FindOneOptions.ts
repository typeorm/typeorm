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
     * Specifies what relations should be loaded.
     */
    join?: JoinOptions;

    /**
     * Order, in which entities should be ordered.
     */
    order?: { [P in keyof Entity]?: "ASC"|"DESC" };

}
