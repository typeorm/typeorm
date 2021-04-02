import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: MoreThan(10) }
 */
export function MoreThan(value) {
    return new FindOperator("moreThan", value);
}

//# sourceMappingURL=MoreThan.js.map
