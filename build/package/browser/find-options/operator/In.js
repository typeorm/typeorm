import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: In([...]) }
 */
export function In(value) {
    return new FindOperator("in", value, true, true);
}

//# sourceMappingURL=In.js.map
