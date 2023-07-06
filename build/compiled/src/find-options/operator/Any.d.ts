import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Any([...]) }
 */
export declare function Any<T>(value: T[] | FindOperator<T>): FindOperator<T>;
