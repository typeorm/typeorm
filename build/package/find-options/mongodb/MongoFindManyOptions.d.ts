import { MongoFindOneOptions } from "./MongoFindOneOptions";
/**
 * Defines a special criteria to find specific entities.
 */
export interface MongoFindManyOptions<Entity = any> extends MongoFindOneOptions<Entity> {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number;
    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number;
}
