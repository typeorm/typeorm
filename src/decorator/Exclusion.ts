import { getMetadataArgsStorage } from "../globals"
import { ExclusionMetadataArgs } from "../metadata-args/ExclusionMetadataArgs"
import { TypeORMError } from "../error"
import { ExclusionOptions } from "./options/ExclusionOptions"

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 * @param expression
 * @param options
 */
export function Exclusion(
    expression: string,
    options?: ExclusionOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 * @param name
 * @param expression
 * @param options
 */
export function Exclusion(
    name: string,
    expression: string,
    options?: ExclusionOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database exclusion.
 * Can be used on entity.
 * Can create exclusions with composite columns when used on entity.
 * @param nameOrExpression
 * @param expressionOrOptions
 * @param maybeOptions
 */
export function Exclusion(
    nameOrExpression: string,
    expressionOrOptions?: string | ExclusionOptions,
    maybeOptions?: ExclusionOptions,
): ClassDecorator & PropertyDecorator {
    const hasName = typeof expressionOrOptions === "string"

    const name = hasName ? nameOrExpression : undefined
    const expression = hasName ? expressionOrOptions : nameOrExpression
    const options = hasName ? maybeOptions : expressionOrOptions

    if (!expression) throw new TypeORMError(`Exclusion expression is required`)

    return function (
        clsOrObject: Function | Object,
        propertyName?: string | symbol,
    ) {
        getMetadataArgsStorage().exclusions.push({
            target: propertyName
                ? clsOrObject.constructor
                : (clsOrObject as Function),
            name: name,
            expression: expression,
            deferrable: options ? options.deferrable : undefined,
        } as ExclusionMetadataArgs)
    }
}
