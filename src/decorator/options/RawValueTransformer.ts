import { DatabaseType } from '../..';


/**
 * Interface for objects that deal with (un)marshalling data.
 */
export interface RawValueTransformer {

  /**
   * Used to marshal data when writing to the database.
   */
  to?(value: any, type: DatabaseType): any;

  /**
   * Used to unmarshal data when reading from the database.
   */
  from?(value: any, type: DatabaseType): any;

}
