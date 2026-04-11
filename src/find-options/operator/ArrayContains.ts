import { FindOperator } from "../FindOperator"

/**
 * FindOptions Operator.
 *
 * @example
 * { someField: ArrayContains([...]) }
 *
 * @param value
 */
export function ArrayContains<T>(
    value: readonly T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("arrayContains", value as any)
}
