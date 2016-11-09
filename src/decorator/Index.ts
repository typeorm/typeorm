import {getMetadataArgsStorage} from "../index";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {IndexOptions} from "./options/IndexOptions";

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, fields: string[], options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(fields: string[], options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(fields: (object: any) => any[], options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(name: string, fields: (object: any) => any[], options?: IndexOptions): Function;

/**
 * Composite index must be set on entity classes and must specify entity's fields to be indexed.
 */
export function Index(nameOrFields: string|string[]|((object: any) => any[]),
                      maybeFieldsOrOptions?: ((object: any) => any[])|IndexOptions|string[],
                      maybeOptions?: IndexOptions): Function {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = typeof nameOrFields === "string" ? <((object: any) => any[])|string[]> maybeFieldsOrOptions : nameOrFields;
    const options = (typeof maybeFieldsOrOptions === "object" && !Array.isArray(maybeFieldsOrOptions)) ? <IndexOptions> maybeFieldsOrOptions : maybeOptions;

    return function (clsOrObject: Function|Object, propertyName?: string) {
        const args: IndexMetadataArgs = {
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            unique: options && options.unique ? true : false
        };
        getMetadataArgsStorage().indices.add(args);
    };
}
