import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Used to negate expression.
 * Example: { title: not("hello") } will return entities where title not equal to "hello".
 */
export function Not(value) {
    return new FindOperator("not", value);
}

//# sourceMappingURL=Not.js.map
