import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Performs a case-insensitive match.
 * Example: { someField: ILike("%SOME string%") }
 */
export function ILike<T>(value: T | FindOperator<T>) {
    return new FindOperator("ilike", value)
}
