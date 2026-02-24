import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { someField: Like("%some string%") }
 * @param value
 */
export function Like<T>(value: T | FindOperator<T>) {
    return new FindOperator("like", value)
}
