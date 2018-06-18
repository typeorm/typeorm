import {FindOneOptions} from "./FindOneOptions";

/**
 * Defines a special criteria to find specific entities.
 */
export interface PaginationOptions<Entity = any> extends FindOneOptions<Entity> {

  /**
   * Specify the offset starting from 0
   */
  page: number;

  /**
   * Limit (paginated) - max number of entities should be taken.
   */
  limit: number;

}
