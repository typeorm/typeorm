"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: Any([...]) }
 */
function Any(value) {
    return new FindOperator_1.FindOperator("any", value);
}
exports.Any = Any;
//# sourceMappingURL=Any.js.map