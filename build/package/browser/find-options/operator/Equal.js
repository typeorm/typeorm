import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
export function Equal(value) {
    return new FindOperator("equal", value);
}

//# sourceMappingURL=Equal.js.map
