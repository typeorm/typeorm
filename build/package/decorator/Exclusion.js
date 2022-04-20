"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exclusion = void 0;
var __1 = require("../");
/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
function Exclusion(nameOrExpression, maybeExpression) {
    var name = maybeExpression ? nameOrExpression : undefined;
    var expression = maybeExpression ? maybeExpression : nameOrExpression;
    if (!expression)
        throw new Error("Exclusion expression is required");
    return function (clsOrObject, propertyName) {
        __1.getMetadataArgsStorage().exclusions.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            expression: expression
        });
    };
}
exports.Exclusion = Exclusion;

//# sourceMappingURL=Exclusion.js.map
