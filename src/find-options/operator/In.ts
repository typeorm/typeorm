import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 *
 * @example
 * { someField: In([...]) }
 *
 * @param value
 */
export function In<T>(
    value: readonly T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("in", value as any, true, true)
}
