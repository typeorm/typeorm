import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { someField: MoreThan(10) }
 * @param value
 */
export function MoreThan<T>(value: T | FindOperator<T>) {
    return new FindOperator("moreThan", value)
}
