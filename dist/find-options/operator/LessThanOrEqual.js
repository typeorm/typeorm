"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: LessThanOrEqual(10) }
 */
function LessThanOrEqual(value) {
    return new FindOperator_1.FindOperator("lessThanOrEqual", value);
}
exports.LessThanOrEqual = LessThanOrEqual;
//# sourceMappingURL=LessThanOrEqual.js.map