import { getMetadataArgsStorage } from "../metadata-args/get-metadata-args-storage";
import { CheckMetadataArgs } from "../metadata-args/CheckMetadataArgs";

/**
 * Creates a database check.
 * Can be used on entity property or on entity.
 * Can create checks with composite columns when used on entity.
 */
export function Check(expression: string): Function;

/**
 * Creates a database check.
 * Can be used on entity property or on entity.
 * Can create checks with composite columns when used on entity.
 */
export function Check(name: string, expression: string): Function;

/**
 * Creates a database check.
 * Can be used on entity property or on entity.
 * Can create checks with composite columns when used on entity.
 */
export function Check(nameOrExpression: string, maybeExpression?: string): Function {

    const name = maybeExpression ? nameOrExpression : undefined;
    const expression = maybeExpression ? maybeExpression : nameOrExpression;

    if (!expression)
        throw new Error(`Check expression is required`);

    return function (clsOrObject: Function | Object, propertyName?: string) {

        getMetadataArgsStorage().checks.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            expression: expression
        } as CheckMetadataArgs);
    };
}
