import {getMetadataArgsStorage} from "../index";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";
import {IndexFields, IndexFieldsFn} from "../metadata-args/types/IndexFields";

/**
 * Composite unique constraint must be set on entity property or on entity and must specify entity's fields to be unique.
 */
export function Unique(name?: string): ClassDecorator & PropertyDecorator;

/**
 * Composite unique constraint must be set on entity and must specify entity's fields to be unique.
 */
export function Unique(fields: IndexFields | IndexFieldsFn): ClassDecorator;

/**
 * Composite unique constraint must be set on entity and must specify entity's fields to be unique.
 */
export function Unique(name: string, fields: IndexFields | IndexFieldsFn): ClassDecorator;

/**
 * Composite unique constraint must be set on entity property or on entity and must specify entity's fields to be unique.
 */
export function Unique(
    nameOrFields?: string | IndexFields | IndexFieldsFn,
    maybeFields?: IndexFields | IndexFieldsFn
): ClassDecorator & PropertyDecorator {
    const name = typeof nameOrFields === "string" ? nameOrFields : undefined;
    const fields = <IndexFields | IndexFieldsFn>(typeof nameOrFields === "string" ? maybeFields : nameOrFields);

    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        getMetadataArgsStorage().uniques.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields
        } as UniqueMetadataArgs);
    };
}
