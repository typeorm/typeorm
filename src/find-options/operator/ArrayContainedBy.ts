import { FindOperator } from "../FindOperator"

/**
 * FindOptions Operator.
 * Example: { someField: ArrayContainedBy([...]) }
 * @param value
 */
export function ArrayContainedBy<T>(
    value: readonly T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("arrayContainedBy", value as any)
}
