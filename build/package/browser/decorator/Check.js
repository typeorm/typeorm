import { getMetadataArgsStorage } from "../globals";
import { TypeORMError } from "../error";
/**
 * Creates a database check.
 * Can be used on entity property or on entity.
 * Can create checks with composite columns when used on entity.
 */
export function Check(nameOrExpression, maybeExpression) {
    const name = maybeExpression ? nameOrExpression : undefined;
    const expression = maybeExpression ? maybeExpression : nameOrExpression;
    if (!expression)
        throw new TypeORMError(`Check expression is required`);
    return function (clsOrObject, propertyName) {
        getMetadataArgsStorage().checks.push({
            target: propertyName
                ? clsOrObject.constructor
                : clsOrObject,
            name: name,
            expression: expression,
        });
    };
}

//# sourceMappingURL=Check.js.map
