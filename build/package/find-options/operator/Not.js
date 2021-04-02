"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Not = void 0;
var FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Used to negotiate expression.
 * Example: { title: not("hello") } will return entities where title not equal to "hello".
 */
function Not(value) {
    return new FindOperator_1.FindOperator("not", value);
}
exports.Not = Not;

//# sourceMappingURL=Not.js.map
