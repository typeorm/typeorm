import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Regexp('/[a-z]/') }
 */
export function Regexp<T>(value: T|FindOperator<T>) {
    return new FindOperator("Regexp", value);
}
