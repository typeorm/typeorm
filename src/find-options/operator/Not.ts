import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Used to negate expression.
 *
 * @example
 * { title: Not("hello") }
 *
 * @param value
 */
export function Not<T>(value: T | FindOperator<T>) {
    return new FindOperator("not", value)
}
