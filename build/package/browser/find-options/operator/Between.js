import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Between(x, y) }
 */
export function Between(from, to) {
    return new FindOperator("between", [from, to], true, true);
}

//# sourceMappingURL=Between.js.map
