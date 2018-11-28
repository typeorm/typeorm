import { ConjunctiveOperator } from "../ConjunctiveOperator";

/**
 * Find Options Operator.
 * Example: { someField: And(Like("%some sting%")) }
 */
export function And(value: any) {
    return new ConjunctiveOperator("and", value);
}
