import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { someField: LessThanOrEqual(10) }
 * @param value
 */
export function LessThanOrEqual<T>(value: T | FindOperator<T>) {
    return new FindOperator("lessThanOrEqual", value)
}
