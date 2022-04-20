import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Any([...]) }
 */
export function Any(value) {
    return new FindOperator("any", value);
}

//# sourceMappingURL=Any.js.map
