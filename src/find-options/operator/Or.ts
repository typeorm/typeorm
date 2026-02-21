import { FindOperator } from "../FindOperator"

/**
 *
 * @param values
 */
export function Or<T>(...values: FindOperator<T>[]): FindOperator<T> {
    return new FindOperator("or", values as any, true, true)
}
