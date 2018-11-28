import { ConjunctiveOperator } from "../ConjunctiveOperator";

/**
 * Find Options Operator.
 * Example: { someField: Or(Like("%some sting%")) }
 */
export function Or(value: any) {
    return new ConjunctiveOperator("or", value);
}
