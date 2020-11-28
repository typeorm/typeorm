import {getMetadataArgsStorage, IndexOptions} from "../";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {IndexFieldsMap} from "../metadata-args/types/IndexFieldsMap";

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
export function Index(name: string, options?: IndexOptions | { synchronize: false }): ClassDecorator & PropertyDecorator;

/**
 * Creates a database index.
 * Can be used on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(fields: string[] | IndexFieldsMap, options?: IndexOptions): ClassDecorator;

/**
 * Creates a database index.
 * Can be used on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, fields: string[] | IndexFieldsMap, options?: IndexOptions): ClassDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(
    nameOrFieldsOrOptions?: string | string[]|IndexFieldsMap | IndexOptions,
    maybeFieldsOrOptions?: string[]|IndexFieldsMap | IndexOptions|{ synchronize: false },
    maybeOptions?: IndexOptions
): ClassDecorator & PropertyDecorator {
    const name = typeof nameOrFieldsOrOptions === "string" ? nameOrFieldsOrOptions : undefined;
    const fields = <IndexFieldsMap|string[]>(typeof nameOrFieldsOrOptions === "string" ? maybeFieldsOrOptions : nameOrFieldsOrOptions);
    let options: IndexOptions & { synchronize?: false } | undefined;
    if (typeof nameOrFieldsOrOptions === "object" && !Array.isArray(nameOrFieldsOrOptions)) {
        options = nameOrFieldsOrOptions;
    } else if (typeof maybeFieldsOrOptions === "object" && !Array.isArray(maybeFieldsOrOptions)) {
        options = maybeFieldsOrOptions;
    } else {
        options = maybeOptions;
    }

    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        getMetadataArgsStorage().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize: options && options.synchronize === false ? false : true,
            where: options ? options.where : undefined,
            unique: options && options.unique ? true : false,
            spatial: options && options.spatial ? true : false,
            fulltext: options && options.fulltext ? true : false,
            parser: options ? options.parser : undefined,
            sparse: options && options.sparse ? true : false,
            background: options && options.background ? true : false,
            expireAfterSeconds: options ? options.expireAfterSeconds : undefined
        } as IndexMetadataArgs);
    };
}
