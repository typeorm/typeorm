import { getMetadataArgsStorage } from "../globals"
import type { UniqueMetadataArgs } from "../metadata-args/UniqueMetadataArgs"
import type { UniqueOptions } from "./options/UniqueOptions"
import type { IndexColumnOptions } from "./options/IndexColumnOptions"
import { ObjectUtils } from "../util/ObjectUtils"

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 *
 * @param name
 * @param fields
 * @param options
 */
export function Unique(
    name: string,
    fields: string[],
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 * Each entry can be a column name string or an object specifying the column and its sort order.
 * Note: sort ordering in unique constraints is only supported by some databases (e.g. SQL Server, MySQL).
 *
 * @param name
 * @param fields
 * @param options
 */
export function Unique(
    name: string,
    fields: (string | IndexColumnOptions)[],
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 *
 * @param fields
 * @param options
 */
export function Unique(
    fields: string[],
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 * Each entry can be a column name string or an object specifying the column and its sort order.
 * Note: sort ordering in unique constraints is only supported by some databases (e.g. SQL Server, MySQL).
 *
 * @param fields
 * @param options
 */
export function Unique(
    fields: (string | IndexColumnOptions)[],
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 *
 * @param fields
 * @param options
 */
export function Unique(
    fields: (object?: any) => any[] | { [key: string]: number },
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 *
 * @param name
 * @param fields
 * @param options
 */
export function Unique(
    name: string,
    fields: (object?: any) => any[] | { [key: string]: number },
    options?: UniqueOptions,
): ClassDecorator & PropertyDecorator

/**
 * Property-level unique constraint. Use the options to specify sort order.
 *
 * @param options
 */
export function Unique(options?: UniqueOptions): PropertyDecorator

/**
 * Property-level unique constraint with a custom name. Use the options to specify sort order.
 *
 * @param name
 * @param options
 */
export function Unique(name: string, options?: UniqueOptions): PropertyDecorator

/**
 * Composite unique constraint must be set on entity classes and must specify entity's fields to be unique.
 *
 * @param nameOrFieldsOrOptions
 * @param maybeFieldsOrOptions
 * @param maybeOptions
 */
export function Unique(
    nameOrFieldsOrOptions?:
        | string
        | (string | IndexColumnOptions)[]
        | ((object: any) => any[] | { [key: string]: number })
        | UniqueOptions,
    maybeFieldsOrOptions?:
        | ((object?: any) => any[] | { [key: string]: number })
        | (string | IndexColumnOptions)[]
        | UniqueOptions,
    maybeOptions?: UniqueOptions,
): ClassDecorator & PropertyDecorator {
    const name =
        typeof nameOrFieldsOrOptions === "string"
            ? nameOrFieldsOrOptions
            : undefined
    // When the first arg is a string (name) and the second is a plain object
    // (not an array, not a function), the caller used @Unique(name, options).
    const secondArgIsOptions =
        typeof nameOrFieldsOrOptions === "string" &&
        ObjectUtils.isObject(maybeFieldsOrOptions) &&
        !Array.isArray(maybeFieldsOrOptions) &&
        typeof maybeFieldsOrOptions !== "function"
    const fields = secondArgIsOptions
        ? undefined
        : typeof nameOrFieldsOrOptions === "string"
          ? <
                | ((object?: any) => any[] | { [key: string]: number })
                | (string | IndexColumnOptions)[]
            >maybeFieldsOrOptions
          : (nameOrFieldsOrOptions as (string | IndexColumnOptions)[])
    let options =
        ObjectUtils.isObject(nameOrFieldsOrOptions) &&
        !Array.isArray(nameOrFieldsOrOptions)
            ? (nameOrFieldsOrOptions as UniqueOptions)
            : maybeOptions
    options ??= secondArgIsOptions
        ? (maybeFieldsOrOptions as UniqueOptions)
        : ObjectUtils.isObject(nameOrFieldsOrOptions) &&
            !Array.isArray(maybeFieldsOrOptions)
          ? (maybeFieldsOrOptions as UniqueOptions)
          : maybeOptions

    return function (
        clsOrObject: Function | Object,
        propertyName?: string | symbol,
    ) {
        let columns = fields

        if (propertyName !== undefined) {
            const order = options?.order
            switch (typeof propertyName) {
                case "string":
                    columns = order
                        ? [{ field: propertyName, order }]
                        : [propertyName]
                    break

                case "symbol":
                    columns = order
                        ? [{ field: propertyName.toString(), order }]
                        : [propertyName.toString()]
                    break
            }
        }

        const args: UniqueMetadataArgs = {
            target: propertyName
                ? clsOrObject.constructor
                : (clsOrObject as Function),
            name: name,
            columns,
            deferrable: options ? options.deferrable : undefined,
        }
        getMetadataArgsStorage().uniques.push(args)
    }
}
