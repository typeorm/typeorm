import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayOverlap([...]) }
 */
export function ArrayOverlap(value) {
    return new FindOperator("arrayOverlap", value);
}

//# sourceMappingURL=ArrayOverlap.js.map
