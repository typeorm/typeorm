import { FindOperator } from "../FindOperator"

/**
 * FindOptions Operator.
 * Example: { someField: ArrayContainedBy([...]) }
 */
export function ArrayContainedBy<T>(
    value: T[] | FindOperator<T>,
): FindOperator<any> {
    return new FindOperator("arrayContainedBy", value as any)
}
