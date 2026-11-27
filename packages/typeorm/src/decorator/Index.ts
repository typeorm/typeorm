import { getMetadataArgsStorage } from "../globals"
import type { IndexMetadataArgs } from "../metadata-args/IndexMetadataArgs"
import type { IndexOptions } from "./options/IndexOptions"
import { ObjectUtils } from "../util/ObjectUtils"

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param options
 */
export function Index(
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param name
 * @param options
 */
export function Index(
    name: string,
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param name
 * @param options
 * @param options.synchronize
 */
export function Index(
    name: string,
    options: { synchronize: false },
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param name
 * @param fields
 * @param options
 */
export function Index(
    name: string,
    fields: string[],
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param fields
 * @param options
 */
export function Index(
    fields: string[],
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param fields
 * @param options
 */
export function Index(
    fields: (object?: any) => any[] | { [key: string]: number },
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param name
 * @param fields
 * @param options
 */
export function Index(
    name: string,
    fields: (object?: any) => any[] | { [key: string]: number },
    options?: IndexOptions,
): ClassDecorator & PropertyDecorator

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 *
 * @param nameOrFieldsOrOptions
 * @param maybeFieldsOrOptions
 * @param maybeOptions
 */
export function Index(
    nameOrFieldsOrOptions?:
        | string
        | string[]
        | ((object: any) => any[] | { [key: string]: number })
        | IndexOptions,
    maybeFieldsOrOptions?:
        | ((object?: any) => any[] | { [key: string]: number })
        | IndexOptions
        | string[]
        | { synchronize: false },
    maybeOptions?: IndexOptions,
): ClassDecorator & PropertyDecorator {
    let name: string | undefined = undefined
    let fields:
        | ((object?: any) => any[] | { [key: string]: number })
        | string[]
        | undefined = undefined
    let options: IndexOptions | undefined = undefined

    if (typeof nameOrFieldsOrOptions === "string") {
        name = nameOrFieldsOrOptions
        if (
            Array.isArray(maybeFieldsOrOptions) ||
            typeof maybeFieldsOrOptions === "function"
        ) {
            fields = maybeFieldsOrOptions
            options = maybeOptions
        } else if (
            ObjectUtils.isObject(maybeFieldsOrOptions) &&
            !Array.isArray(maybeFieldsOrOptions)
        ) {
            options = maybeFieldsOrOptions as IndexOptions
        }
    } else if (
        Array.isArray(nameOrFieldsOrOptions) ||
        typeof nameOrFieldsOrOptions === "function"
    ) {
        fields = nameOrFieldsOrOptions
        options = maybeFieldsOrOptions as IndexOptions
    } else if (
        ObjectUtils.isObject(nameOrFieldsOrOptions) &&
        !Array.isArray(nameOrFieldsOrOptions)
    ) {
        options = nameOrFieldsOrOptions as IndexOptions
    }

    return function (
        clsOrObject: Function | Object,
        propertyName?: string | symbol,
    ) {
        getMetadataArgsStorage().indices.push({
            target: propertyName
                ? clsOrObject.constructor
                : (clsOrObject as Function),
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize:
                options &&
                (options as { synchronize: false }).synchronize === false
                    ? false
                    : true,
            where: options ? options.where : undefined,
            type: options ? options.type : undefined,
            unique: options?.unique ? true : false,
            spatial: options?.spatial ? true : false,
            fulltext: options?.fulltext ? true : false,
            nullFiltered: options?.nullFiltered ? true : false,
            parser: options ? options.parser : undefined,
            sparse: options?.sparse ? true : false,
            background: options?.background ? true : false,
            concurrent: options?.concurrent ? true : false,
            expireAfterSeconds: options
                ? options.expireAfterSeconds
                : undefined,
        } as IndexMetadataArgs)
    }
}
