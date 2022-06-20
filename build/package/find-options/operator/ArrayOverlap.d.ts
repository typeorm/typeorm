import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayOverlap([...]) }
 */
export declare function ArrayOverlap<T>(value: T[] | FindOperator<T>): FindOperator<any>;
