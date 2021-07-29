/**
 * Defines a special criteria to find specific entities.
 */
export interface FindTreeOptions<Entity = any> {

  /**
    * Indicates what relations of entity should be loaded (simplified left join form).
   */
  relations?: string[];

}
