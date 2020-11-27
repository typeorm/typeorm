import {IndexOptions} from './IndexOptions';
import {RelationOptions} from './RelationOptions';

/**
 * Describes a many-to-one relation's options
 */
export interface ManyToOneOptions extends RelationOptions {
  /**
   * Create an index on the referencing column of the many-to-one relation.
   */
  index?: boolean | IndexOptions & { name?: string };
}