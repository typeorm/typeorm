import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
export function List<T>(value: T|FindOperator<T>) {
    return new FindOperator("list", value, true, true);
}
