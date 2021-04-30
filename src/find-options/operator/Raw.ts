import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
export function Raw(value: string|((columnAlias?: string) => string)): FindOperator<any> {
    return new FindOperator("raw", value as any, false);
}
