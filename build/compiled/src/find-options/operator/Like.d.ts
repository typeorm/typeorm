import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Like("%some sting%") }
 */
export declare function Like<T>(value: T | FindOperator<T>): FindOperator<T>;
