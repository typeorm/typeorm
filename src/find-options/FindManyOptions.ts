import { FindOneOptions } from "./FindOneOptions"
import { FindOptionsWhere } from "./FindOptionsWhere"

/**
 * Defines a special criteria to find specific entities.
 */
export interface FindManyOptions<Entity = any>
    extends Omit<FindOneOptions<Entity>, "where"> {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number

    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number

    /**
     * Simple condition that should be applied to match entities.
     */
    where?: FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>
}
