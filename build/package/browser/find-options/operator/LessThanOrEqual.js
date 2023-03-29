import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: LessThanOrEqual(10) }
 */
export function LessThanOrEqual(value) {
    return new FindOperator("lessThanOrEqual", value);
}

//# sourceMappingURL=LessThanOrEqual.js.map
