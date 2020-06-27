import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
export function Raw<T>(value: string|((columnAlias: string) => string)) {
    return new FindOperator("raw", value as any, false);
}