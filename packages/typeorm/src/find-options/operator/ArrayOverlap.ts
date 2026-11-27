import { FindOperator } from "../FindOperator"

/**
 * FindOptions Operator.
 *
 * @example
 * { someField: ArrayOverlap([...]) }
 *
 * @param value
 */
export function ArrayOverlap<T>(
    value: readonly T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("arrayOverlap", value as any)
}
