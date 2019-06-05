import {getMetadataArgsStorage} from "../";
import {ExclusionMetadataArgs} from "../metadata-args/ExclusionMetadataArgs";

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
export function Exclusion(expression: string): Function;

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
export function Exclusion(name: string, expression: string): Function;

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 */
export function Exclusion(nameOrExpression: string, maybeExpression?: string): Function {

    const name = maybeExpression ? nameOrExpression : undefined;
    const expression = maybeExpression ? maybeExpression : nameOrExpression;

    if (!expression)
        throw new Error(`Exclusion expression is required`);

    return function (clsOrObject: Function|Object, propertyName?: string) {

        getMetadataArgsStorage().exclusions.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            expression: expression
        } as ExclusionMetadataArgs);
    };
}
