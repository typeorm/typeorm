import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: MoreThanOrEqual(10) }
 */
export function MoreThanOrEqual(value) {
    return new FindOperator("moreThanOrEqual", value);
}

//# sourceMappingURL=MoreThanOrEqual.js.map
