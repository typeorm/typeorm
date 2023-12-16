import { FindOperator } from "../FindOperator"

/**
 * Find Options Operator.
 * Example: { translations: JSONOperator('en', ILike('random name')) }
 */
export function JSONOperator<T>(
    jsonKey: T,
    operator: FindOperator<T>,
): FindOperator<T> {
    return new FindOperator(
        "jsonOperator",
        [jsonKey, operator] as any,
        true,
        true,
    )
}
