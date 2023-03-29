import { getMetadataArgsStorage } from "../";
/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
export function Exclusion(nameOrExpression, maybeExpression) {
    var name = maybeExpression ? nameOrExpression : undefined;
    var expression = maybeExpression ? maybeExpression : nameOrExpression;
    if (!expression)
        throw new Error("Exclusion expression is required");
    return function (clsOrObject, propertyName) {
        getMetadataArgsStorage().exclusions.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject,
            name: name,
            expression: expression
        });
    };
}

//# sourceMappingURL=Exclusion.js.map
