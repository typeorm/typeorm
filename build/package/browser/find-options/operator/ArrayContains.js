import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContains([...]) }
 */
export function ArrayContains(value) {
    return new FindOperator("arrayContains", value);
}

//# sourceMappingURL=ArrayContains.js.map
