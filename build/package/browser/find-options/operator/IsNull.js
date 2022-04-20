import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: IsNull() }
 */
export function IsNull() {
    return new FindOperator("isNull", undefined, false);
}

//# sourceMappingURL=IsNull.js.map
