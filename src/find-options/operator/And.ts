import { FindOperator } from "../FindOperator"

/**
 *
 * @param values
 */
export function And<T>(...values: FindOperator<T>[]): FindOperator<T> {
    return new FindOperator("and", values as any, true, true)
}
