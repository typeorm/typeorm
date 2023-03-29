import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: ILike("%SOME string%") }
 */
export function ILike(value) {
    return new FindOperator("ilike", value);
}

//# sourceMappingURL=ILike.js.map
