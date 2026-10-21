import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 *
 * @example
 * { someField: LessThan(10) }
 *
 * @param value
 */
export function LessThan<T>(value: T | FindOperator<T>) {
    return new FindOperator("lessThan", value)
}
