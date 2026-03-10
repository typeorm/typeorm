import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { someField: ILike("%SOME string%") }
 * @param value
 */
export function ILike<T>(value: T | FindOperator<T>) {
    return new FindOperator("ilike", value)
}
