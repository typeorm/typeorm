import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: In([...]) }
 */
export declare function In<T>(value: T[] | FindOperator<T>): FindOperator<T>;
