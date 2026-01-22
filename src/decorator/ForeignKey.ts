import { ObjectType } from "../common/ObjectType"
import { getMetadataArgsStorage } from "../globals"
import { ForeignKeyMetadataArgs } from "../metadata-args/ForeignKeyMetadataArgs"
import { ObjectUtils } from "../util/ObjectUtils"
import { ForeignKeyOptions } from "./options/ForeignKeyOptions"

/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 * @param typeFunctionOrTarget
 * @param options
 */
export function ForeignKey<T>(
    typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>),
    options?: ForeignKeyOptions,
): PropertyDecorator

/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 * @param typeFunctionOrTarget
 * @param inverseSide
 * @param options
 */
export function ForeignKey<T>(
    typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>),
    inverseSide: string | ((object: T) => any),
    options?: ForeignKeyOptions,
): PropertyDecorator

/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 * @param typeFunctionOrTarget
 * @param columnNames
 * @param referencedColumnNames
 * @param options
 */
export function ForeignKey<
    T,
    C extends (readonly [] | readonly string[]) &
        (number extends C["length"] ? readonly [] : unknown),
>(
    typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>),
    columnNames: C,
    referencedColumnNames: { [K in keyof C]: string },
    options?: ForeignKeyOptions,
): ClassDecorator

/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 * @param typeFunctionOrTarget
 * @param inverseSideOrColumnNamesOrOptions
 * @param referencedColumnNamesOrOptions
 * @param maybeOptions
 */
export function ForeignKey<
    T,
    C extends (readonly [] | readonly string[]) &
        (number extends C["length"] ? readonly [] : unknown),
>(
    typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>),
    inverseSideOrColumnNamesOrOptions?:
        | string
        | ((object: T) => any)
        | C
        | ForeignKeyOptions,
    referencedColumnNamesOrOptions?:
        | { [K in keyof C]: string }
        | ForeignKeyOptions,
    maybeOptions?: ForeignKeyOptions,
): ClassDecorator & PropertyDecorator {
    const inverseSide =
        typeof inverseSideOrColumnNamesOrOptions === "string" ||
        typeof inverseSideOrColumnNamesOrOptions === "function"
            ? inverseSideOrColumnNamesOrOptions
            : undefined

    const columnNames = Array.isArray(inverseSideOrColumnNamesOrOptions)
        ? inverseSideOrColumnNamesOrOptions
        : undefined

    const referencedColumnNames = Array.isArray(referencedColumnNamesOrOptions)
        ? referencedColumnNamesOrOptions
        : undefined

    const options =
        ObjectUtils.isObject(inverseSideOrColumnNamesOrOptions) &&
        !Array.isArray(inverseSideOrColumnNamesOrOptions)
            ? inverseSideOrColumnNamesOrOptions
            : ObjectUtils.isObject(referencedColumnNamesOrOptions) &&
                !Array.isArray(referencedColumnNamesOrOptions)
              ? referencedColumnNamesOrOptions
              : maybeOptions

    return function (
        clsOrObject: Function | Object,
        propertyName?: string | symbol,
    ) {
        getMetadataArgsStorage().foreignKeys.push({
            target: propertyName
                ? clsOrObject.constructor
                : (clsOrObject as Function),
            propertyName: propertyName,
            type: typeFunctionOrTarget,
            inverseSide,
            columnNames,
            referencedColumnNames,
            ...(options as ForeignKeyOptions),
        } as ForeignKeyMetadataArgs)
    }
}
