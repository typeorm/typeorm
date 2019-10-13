"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
function Raw(value) {
    return new FindOperator_1.FindOperator("raw", value, false);
}
exports.Raw = Raw;
//# sourceMappingURL=Raw.js.map