import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContains([...]) }
 */
export declare function ArrayContains<T>(value: T[] | FindOperator<T>): FindOperator<any>;
