import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Like("%some sting%") }
 */
export function Like(value) {
    return new FindOperator("like", value);
}

//# sourceMappingURL=Like.js.map
