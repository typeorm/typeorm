import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
export declare function Equal<T>(value: T | FindOperator<T>): FindOperator<T>;
