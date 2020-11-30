import {getMetadataArgsStorage, IndexOptions} from "../";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {IndexFields, IndexFieldsFn} from "../metadata-args/types/IndexFields";

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
export function Index(fields: IndexFields | IndexFieldsFn, options?: IndexOptions): ClassDecorator;

/**
 * Creates a database index.
 * Can be used on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(name: string, fields: IndexFields | IndexFieldsFn, options?: IndexOptions): ClassDecorator;

/**
 * Creates a database index.
 * Can be used on entity property or on entity.
 * Can create indices with composite columns when used on entity.
 */
export function Index(
    nameOrFieldsOrOptions?: string | IndexFields|IndexFieldsFn | IndexOptions,
    maybeFieldsOrOptions?: IndexFields|IndexFieldsFn | IndexOptions|{ synchronize: false },
    maybeOptions?: IndexOptions
): ClassDecorator & PropertyDecorator {
    const name = typeof nameOrFieldsOrOptions === "string" ? nameOrFieldsOrOptions : undefined;
    const fields = <IndexFields|IndexFieldsFn>(typeof nameOrFieldsOrOptions === "string" ? maybeFieldsOrOptions : nameOrFieldsOrOptions);
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
