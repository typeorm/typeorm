"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: MoreThan(10) }
 */
function MoreThan(value) {
    return new FindOperator_1.FindOperator("moreThan", value);
}
exports.MoreThan = MoreThan;
//# sourceMappingURL=MoreThan.js.map