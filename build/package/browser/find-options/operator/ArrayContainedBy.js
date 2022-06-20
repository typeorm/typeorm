import { FindOperator } from "../FindOperator";
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContainedBy([...]) }
 */
export function ArrayContainedBy(value) {
    return new FindOperator("arrayContainedBy", value);
}

//# sourceMappingURL=ArrayContainedBy.js.map
