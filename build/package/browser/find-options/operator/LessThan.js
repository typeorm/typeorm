import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: LessThan(10) }
 */
export function LessThan(value) {
    return new FindOperator("lessThan", value);
}

//# sourceMappingURL=LessThan.js.map
