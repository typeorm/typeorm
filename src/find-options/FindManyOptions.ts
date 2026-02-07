import { FindOneOptions } from "./FindOneOptions"

/**
 * Defines a special criteria to find specific entities.
 */
export interface FindManyOptions<Entity = any> extends FindOneOptions<Entity> {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number

    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number

    /**
     * Indicates if the underlying `count` query will be executed with the DISTINCT keyword.
     *
     * Note: This option is only honored when using `count` method of repository and entity manager
     */
    distinct?: boolean
}
