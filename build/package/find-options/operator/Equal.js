"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Equal = void 0;
const FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
function Equal(value) {
    return new FindOperator_1.FindOperator("equal", value);
}
exports.Equal = Equal;

//# sourceMappingURL=Equal.js.map
