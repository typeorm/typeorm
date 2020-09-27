import {getMetadataArgsStorage, IndexOptions} from "../";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {IndexOrderOptions} from "../metadata/types/IndexOrderOptions";

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, options: { synchronize: false }): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, fields: string[], options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(fields: string[], options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(fields: (object?: any) => (any[]|{ [key: string]: number }), options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, fields: (object?: any) => (any[]|{ [key: string]: number }), options?: IndexOptions): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(nameOrFieldsOrOptions?: string|string[]|((object: any) => (any[]|{ [key: string]: number }))|IndexOptions,
                      maybeFieldsOrOptions?: ((object?: any) => (any[]|{ [key: string]: number }))|IndexOptions|string[]|{ synchronize: false },
                      maybeOptions?: IndexOptions): ClassDecorator & PropertyDecorator {

    // normalize parameters
    const name = typeof nameOrFieldsOrOptions === "string" ? nameOrFieldsOrOptions : undefined;
    const fields = typeof nameOrFieldsOrOptions === "string" ? <((object?: any) => (any[]|{ [key: string]: number }))|string[]> maybeFieldsOrOptions : nameOrFieldsOrOptions as string[];
    let options = (typeof nameOrFieldsOrOptions === "object" && !Array.isArray(nameOrFieldsOrOptions)) ? nameOrFieldsOrOptions as IndexOptions : maybeOptions;
    if (!options)
        options = (typeof maybeFieldsOrOptions === "object" && !Array.isArray(maybeFieldsOrOptions)) ? maybeFieldsOrOptions as IndexOptions : maybeOptions;

    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        let orderBy: IndexOrderOptions | undefined;
        if (options) {
            if (!propertyName || typeof options.orderBy === "string") {
                orderBy = options.orderBy;
            } else if (propertyName && options.orderBy && options.orderBy.hasOwnProperty(propertyName)) {
                orderBy = {
                    [propertyName]: options.orderBy[propertyName.toString()]
                };
            } else {
                orderBy = undefined;
            }
        } else {
            orderBy = undefined;
        }

        getMetadataArgsStorage().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize: options && (options as { synchronize: false }).synchronize === false ? false : true,
            where: options ? options.where : undefined,
            unique: options && options.unique ? true : false,
            spatial: options && options.spatial ? true : false,
            fulltext: options && options.fulltext ? true : false,
            parser: options ? options.parser : undefined,
            sparse: options && options.sparse ? true : false,
            background: options && options.background ? true : false,
            expireAfterSeconds: options ? options.expireAfterSeconds : undefined,
            orderBy: orderBy
        } as IndexMetadataArgs);
    };
}
