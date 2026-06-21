import { FindOperator } from "../FindOperator"

/**
 *
 * @param value
 */
export function Regexp<T>(value: T | FindOperator<T>) {
    return new FindOperator("regexp", value)
}
