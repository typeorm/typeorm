import { getMetadataArgsStorage } from "../globals";
import { TypeORMError } from "../error";
/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
export function Exclusion(nameOrExpression, maybeExpression) {
    const name = maybeExpression ? nameOrExpression : undefined;
    const expression = maybeExpression ? maybeExpression : nameOrExpression;
    if (!expression)
        throw new TypeORMError(`Exclusion expression is required`);
    return function (clsOrObject, propertyName) {
        getMetadataArgsStorage().exclusions.push({
            target: propertyName
                ? clsOrObject.constructor
                : clsOrObject,
            name: name,
            expression: expression,
        });
    };
}

//# sourceMappingURL=Exclusion.js.map
