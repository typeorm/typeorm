import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
export function Equal<T>(value: T|FindOperator<T>) {
    return new FindOperator("equal", value);
}