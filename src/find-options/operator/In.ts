import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { someField: In([...]) }
 * @param value
 */
export function In<T>(
    value: readonly T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("in", value as any, true, true)
}
