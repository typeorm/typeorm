import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContainedBy([...]) }
 */
export declare function ArrayContainedBy<T>(value: T[] | FindOperator<T>): FindOperator<any>;
